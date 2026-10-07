// ─────────────────────────────────────────────────────────────
//  KitsuyStore — App (Entry Component)
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import type { Order, Client, FinancialStats, PaymentReceipt, ReceiptFormData } from "./types";
import { useOrders }  from "./hooks/useOrders";
import { useClients } from "./hooks/useClients";
import { useReceipts } from "./hooks/useReceipts";
import { useAuth }    from "./hooks/useAuth";
import type { AuthState } from "./hooks/useAuth";

import { AuthGuard }       from "./components/auth/AuthGuard";
import { Header }          from "./components/layout/Header";
import { Dashboard }       from "./components/dashboard/Dashboard";
import { OrdersTab }       from "./components/orders/OrdersTab";
import { OrderModal }      from "./components/orders/OrderModal";
import { ClientsTab }      from "./components/clients/ClientsTab";
import { ClientModal }     from "./components/clients/ClientModal";
import { ViewClientModal } from "./components/clients/ViewClientModal";
import { ReceiptsTab }     from "./components/receipts/ReceiptsTab";
import { ReceiptModal }    from "./components/receipts/ReceiptModal";

import "./styles/globals.css";
import "./components/ui/UI.css";
import "./App.css";

type Tab = "dashboard" | "orders" | "clients" | "receipts";
type OrderModalState  = { mode: "add" } | { mode: "edit"; data: Order };
type ClientModalState = { mode: "add" } | { mode: "edit"; data: Client };
type ReceiptModalState = { mode: "add"; initial?: Partial<ReceiptFormData> } | { mode: "edit"; data: PaymentReceipt };

// ── AppInner recebe auth como prop — sem chamar useAuth() de novo ──
function AppInner({ auth }: { auth: AuthState }) {
  const { orders, addOrder, updateOrder, deleteOrder, getOrdersByClient } = useOrders();
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { receipts, addReceipt, updateReceipt, deleteReceipt, forgetOrder } = useReceipts();

  const userName = auth.user?.user_metadata?.name as string | undefined;

  const [tab, setTab]                 = useState<Tab>("dashboard");
  const [orderModal, setOrderModal]   = useState<OrderModalState | null>(null);
  const [clientModal, setClientModal] = useState<ClientModalState | null>(null);
  const [viewClient, setViewClient]   = useState<Client | null>(null);
  const [receiptModal, setReceiptModal] = useState<ReceiptModalState | null>(null);

  const [orderSearch,    setOrderSearch]    = useState("");
  const [shippingFilter, setShippingFilter] = useState("all");
  const [clientSearch,   setClientSearch]   = useState("");

  // Só fecha o modal se o banco confirmar — em caso de erro, avisa e mantém os dados no formulário
  const handleSaveOrder = async (data: Order | Omit<Order, "id" | "createdAt">) => {
    try {
      if ("id" in data) await updateOrder(data as Order);
      else await addOrder(data as Omit<Order, "id" | "createdAt">);
      setOrderModal(null);
    } catch (e: any) {
      alert(`Erro ao salvar o pedido: ${e?.message ?? e}`);
    }
  };

  const handleSaveClient = async (data: Client | Omit<Client, "id" | "createdAt">) => {
    try {
      if ("id" in data) await updateClient(data as Client);
      else await addClient(data as Omit<Client, "id" | "createdAt">);
      setClientModal(null);
    } catch (e: any) {
      alert(`Erro ao salvar o cliente: ${e?.message ?? e}`);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteOrder(id);
      forgetOrder(id);
    } catch (e: any) {
      alert(`Erro ao remover o pedido: ${e?.message ?? e}`);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClient(id);
    } catch (e: any) {
      // 23503 = cliente ainda referenciado (comprovantes não podem ficar sem cliente)
      alert(e?.code === "23503"
        ? "Este cliente tem comprovantes de pagamento vinculados. Remova ou reatribua os comprovantes antes de apagar o cliente."
        : `Erro ao remover o cliente: ${e?.message ?? e}`);
    }
  };

  const handleSaveReceipt = async (file: File | null, data: PaymentReceipt | ReceiptFormData) => {
    try {
      if ("id" in data) await updateReceipt(data as PaymentReceipt);
      else await addReceipt(file!, data);
      setReceiptModal(null);
    } catch (e: any) {
      alert(`Erro ao salvar o comprovante: ${e?.message ?? e}`);
    }
  };

  const handleDeleteReceipt = async (r: PaymentReceipt) => {
    try {
      await deleteReceipt(r);
    } catch (e: any) {
      alert(`Erro ao remover o comprovante: ${e?.message ?? e}`);
    }
  };

  // Comprovantes já pré-vinculados ao pedido (e ao cliente dele)
  const newReceiptForOrder = (o: Order) =>
    setReceiptModal({ mode: "add", initial: o.clientId ? { clientIds: [o.clientId], orderIds: [o.id] } : {} });

  const receiptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    receipts.forEach(r => r.orderIds.forEach(id => { counts[id] = (counts[id] ?? 0) + 1; }));
    return counts;
  }, [receipts]);

  const filteredOrders = useMemo(() => {
    const s = orderSearch.toLowerCase();
    return orders.filter(o => {
      const cl = clients.find(c => c.id === o.clientId);
      return (
        (!s || o.productName?.toLowerCase().includes(s) || cl?.name?.toLowerCase().includes(s)
            || o.sellerName?.toLowerCase().includes(s)) &&
        (shippingFilter === "all" || o.shippingStatus === shippingFilter)
      );
    });
  }, [orders, clients, orderSearch, shippingFilter]);

  const sellers = useMemo(() =>
    [...new Set(orders.map(o => o.sellerName.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [orders]
  );

  const filteredClients = useMemo(() =>
    clients.filter(c => {
      const s = clientSearch.toLowerCase();
      return !s || c.name?.toLowerCase().includes(s) || c.phone?.includes(s);
    }),
    [clients, clientSearch]
  );

  const stats = useMemo<FinancialStats>(() => {
    const totalRevenue  = orders.reduce((s, o) => s + (parseFloat(o.salePrice) || 0), 0);
    const totalCost     = orders.reduce((s, o) => s + (parseFloat(o.purchasePrice) || 0), 0);
    const totalProfit   = orders.reduce((s, o) => s + Math.max(0, (parseFloat(o.marginValue) || 0) - (parseFloat(o.discountValue) || 0)), 0);
    const totalReceived = orders.reduce((s, o) => {
      const v = parseFloat(o.salePrice) || 0;
      if (o.paymentMode === "full") return s + (o.depositPaid ? v : 0);
      return s + (o.depositPaid ? v * 0.5 : 0) + (o.finalPaymentPaid ? v * 0.5 : 0);
    }, 0);
    return {
      totalOrders: orders.length,
      totalRevenue,
      totalCost,
      totalProfit,
      totalReceived,
      totalPending: totalRevenue - totalReceived,
    };
  }, [orders]);

  return (
    <div className="app">
      <Header
        activeTab={tab}
        onTabChange={setTab}
        orderCount={orders.length}
        clientCount={clients.length}
        receiptCount={receipts.length}
        user={auth.user!}
        onSignOut={auth.signOut}
      />

      <main className="page-wrapper">
        {tab === "dashboard" && (
          <Dashboard userName={userName} orders={orders} clients={clients} stats={stats} onGoToOrders={() => setTab("orders")} />
        )}
        {tab === "orders" && (
          <OrdersTab
            orders={filteredOrders} clients={clients}
            search={orderSearch} setSearch={setOrderSearch}
            shippingFilter={shippingFilter} setShippingFilter={setShippingFilter}
            onAdd={() => setOrderModal({ mode: "add" })}
            onEdit={o => setOrderModal({ mode: "edit", data: o })}
            onDelete={handleDeleteOrder}
            receiptCounts={receiptCounts}
          />
        )}
        {tab === "clients" && (
          <ClientsTab
            clients={filteredClients} orders={orders}
            search={clientSearch} setSearch={setClientSearch}
            onAdd={() => setClientModal({ mode: "add" })}
            onEdit={c => setClientModal({ mode: "edit", data: c })}
            onDelete={handleDeleteClient}
            onView={setViewClient}
          />
        )}
        {tab === "receipts" && (
          <ReceiptsTab
            receipts={receipts} clients={clients} orders={orders}
            onAdd={() => setReceiptModal({ mode: "add" })}
            onEdit={r => setReceiptModal({ mode: "edit", data: r })}
            onDelete={handleDeleteReceipt}
          />
        )}
      </main>

      {orderModal && (
        <OrderModal
          mode={orderModal.mode}
          data={orderModal.mode === "edit" ? orderModal.data : undefined}
          clients={clients}
          sellers={sellers}
          receipts={orderModal.mode === "edit" ? receipts.filter(r => r.orderIds.includes(orderModal.data.id)) : []}
          onAddReceipt={orderModal.mode === "edit" ? () => newReceiptForOrder(orderModal.data) : undefined}
          onEditReceipt={r => setReceiptModal({ mode: "edit", data: r })}
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
          receipts={receipts.filter(r => r.clientIds.includes(viewClient.id))}
          onAddReceipt={() => setReceiptModal({ mode: "add", initial: { clientIds: [viewClient.id] } })}
          onEditReceipt={r => setReceiptModal({ mode: "edit", data: r })}
          onClose={() => setViewClient(null)}
          onEdit={() => {
            setClientModal({ mode: "edit", data: viewClient });
            setViewClient(null);
          }}
        />
      )}
      {receiptModal && (
        <ReceiptModal
          mode={receiptModal.mode}
          data={receiptModal.mode === "edit" ? receiptModal.data : undefined}
          initial={receiptModal.mode === "add" ? receiptModal.initial : undefined}
          clients={clients}
          orders={orders}
          onSave={handleSaveReceipt}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </div>
  );
}

// ── App chama useAuth UMA vez e passa para baixo ──
export default function App() {
  const auth = useAuth();
  return (
    <AuthGuard auth={auth}>
      <AppInner auth={auth} />
    </AuthGuard>
  );
}