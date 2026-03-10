// ─────────────────────────────────────────────────────────────
//  KitsuyStore — App (Entry Component)
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import type { Order, Client, FinancialStats } from "./types";
import { useOrders }  from "./hooks/useOrders";
import { useClients } from "./hooks/useClients";

import { Header }          from "./components/layout/Header";
import { Dashboard }       from "./components/dashboard/Dashboard";
import { OrdersTab }       from "./components/orders/OrdersTab";
import { OrderModal }      from "./components/orders/OrderModal";
import { ClientsTab }      from "./components/clients/ClientsTab";
import { ClientModal }     from "./components/clients/ClientModal";
import { ViewClientModal } from "./components/clients/ViewClientModal";

import "./styles/globals.css";
import "./components/ui/UI.css";
import "./App.css";

type Tab = "dashboard" | "orders" | "clients";

type OrderModalState  = { mode: "add" } | { mode: "edit"; data: Order };
type ClientModalState = { mode: "add" } | { mode: "edit"; data: Client };

export default function App() {
  const { orders, addOrder, updateOrder, deleteOrder, getOrdersByClient } = useOrders();
  const { clients, addClient, updateClient, deleteClient } = useClients();

  const [tab, setTab]                 = useState<Tab>("dashboard");
  const [orderModal, setOrderModal]   = useState<OrderModalState | null>(null);
  const [clientModal, setClientModal] = useState<ClientModalState | null>(null);
  const [viewClient, setViewClient]   = useState<Client | null>(null);

  const [orderSearch,    setOrderSearch]    = useState("");
  const [shippingFilter, setShippingFilter] = useState("all");
  const [clientSearch,   setClientSearch]   = useState("");

  // ── Handlers ──────────────────────────────────────────────
  const handleSaveOrder = (data: Order | Omit<Order, "id" | "createdAt">) => {
    if ("id" in data) updateOrder(data as Order);
    else addOrder(data as Omit<Order, "id" | "createdAt">);
    setOrderModal(null);
  };

  const handleSaveClient = (data: Client | Omit<Client, "id" | "createdAt">) => {
    if ("id" in data) updateClient(data as Client);
    else addClient(data as Omit<Client, "id" | "createdAt">);
    setClientModal(null);
  };

  // ── Filtered lists ─────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const s = orderSearch.toLowerCase();
    return orders.filter(o => {
      const cl = clients.find(c => c.id === o.clientId);
      return (
        (!s || o.productName?.toLowerCase().includes(s) || cl?.name?.toLowerCase().includes(s)) &&
        (shippingFilter === "all" || o.shippingStatus === shippingFilter)
      );
    });
  }, [orders, clients, orderSearch, shippingFilter]);

  const filteredClients = useMemo(() =>
    clients.filter(c => {
      const s = clientSearch.toLowerCase();
      return !s || c.name?.toLowerCase().includes(s) || c.phone?.includes(s);
    }),
    [clients, clientSearch]
  );

  // ── Financial stats ────────────────────────────────────────
  const stats = useMemo<FinancialStats>(() => {
    const totalRevenue  = orders.reduce((s, o) => s + (parseFloat(o.salePrice) || 0), 0);
    const totalCost     = orders.reduce((s, o) => s + (parseFloat(o.purchasePrice) || 0), 0);
    const totalProfit2  = orders.reduce((s, o) => s + Math.max(0, (parseFloat(o.marginValue) || 0) - (parseFloat(o.discountValue) || 0)), 0);
    const totalReceived = orders.reduce((s, o) => {
      const v = parseFloat(o.salePrice) || 0;
      if (o.paymentMode === "full") return s + (o.depositPaid ? v : 0);
      return s + (o.depositPaid ? v * 0.5 : 0) + (o.finalPaymentPaid ? v * 0.5 : 0);
    }, 0);
    return {
      totalOrders:   orders.length,
      totalRevenue,
      totalCost,
      totalProfit:   totalProfit2,
      totalReceived,
      totalPending:  totalRevenue - totalReceived,
    };
  }, [orders]);

  return (
    <div className="app">
      <Header
        activeTab={tab}
        onTabChange={setTab}
        orderCount={orders.length}
        clientCount={clients.length}
      />

      <main className="page-wrapper">
        {tab === "dashboard" && (
          <Dashboard
            orders={orders}
            clients={clients}
            stats={stats}
            onGoToOrders={() => setTab("orders")}
          />
        )}
        {tab === "orders" && (
          <OrdersTab
            orders={filteredOrders}
            clients={clients}
            search={orderSearch}
            setSearch={setOrderSearch}
            shippingFilter={shippingFilter}
            setShippingFilter={setShippingFilter}
            onAdd={() => setOrderModal({ mode: "add" })}
            onEdit={o => setOrderModal({ mode: "edit", data: o })}
            onDelete={deleteOrder}
          />
        )}
        {tab === "clients" && (
          <ClientsTab
            clients={filteredClients}
            orders={orders}
            search={clientSearch}
            setSearch={setClientSearch}
            onAdd={() => setClientModal({ mode: "add" })}
            onEdit={c => setClientModal({ mode: "edit", data: c })}
            onDelete={deleteClient}
            onView={setViewClient}
          />
        )}
      </main>

      {/* Modals */}
      {orderModal && (
        <OrderModal
          mode={orderModal.mode}
          data={orderModal.mode === "edit" ? orderModal.data : undefined}
          clients={clients}
          onSave={handleSaveOrder}
          onClose={() => setOrderModal(null)}
        />
      )}
      {clientModal && (
        <ClientModal
          mode={clientModal.mode}
          data={clientModal.mode === "edit" ? clientModal.data : undefined}
          onSave={handleSaveClient}
          onClose={() => setClientModal(null)}
        />
      )}
      {viewClient && (
        <ViewClientModal
          client={viewClient}
          orders={getOrdersByClient(viewClient.id)}
          onClose={() => setViewClient(null)}
          onEdit={() => {
            setClientModal({ mode: "edit", data: viewClient });
            setViewClient(null);
          }}
        />
      )}
    </div>
  );
}
