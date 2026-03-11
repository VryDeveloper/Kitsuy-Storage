// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Dashboard Component
// ─────────────────────────────────────────────────────────────

import type { Order, Client, FinancialStats } from "../../types";
import { fmt } from "../../utils/formatters";
import { ShippingBadge, PaymentStatus } from "../ui/Badge";
import { Button } from "../ui/Button";
import "./Dashboard.css";

interface DashboardProps {
  orders: Order[];
  clients: Client[];
  stats: FinancialStats;
  onGoToOrders: () => void;
  userName?: string;
}

export function Dashboard({ orders, clients, stats, onGoToOrders, userName }: DashboardProps) {
  const recent    = [...orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const inTransit = orders.filter(o => ["ordered","in_transit"].includes(o.shippingStatus)).length;
  const arrived   = orders.filter(o => o.shippingStatus === "arrived_brazil").length;
  const delivered = orders.filter(o => o.shippingStatus === "delivered").length;

  const statCards = [
    { label: "Pedidos Totais", value: stats.totalOrders,              sub: `${inTransit} em trânsito`, icon: "📦", cls: "pink" },
    { label: "Receita Total",  value: fmt(stats.totalRevenue),        sub: "Valor de vendas",           icon: "💰", cls: "" },
    { label: "Lucro Total",    value: fmt(stats.totalProfit),         sub: "Venda − Custo",             icon: "📈", cls: stats.totalProfit >= 0 ? "green" : "red" },
    { label: "A Receber",      value: fmt(stats.totalPending),        sub: `Recebido: ${fmt(stats.totalReceived)}`, icon: "🎯", cls: "pink" },
  ];

  return (
    <div>
      <div className="dashboard-greeting">
        <h1>Olá, {userName} 🌸</h1>
        <p>Aqui está o resumo da sua loja</p>
      </div>

      {/* Stat cards */}
      <div className="grid-4 dashboard-stats">
        {statCards.map((s, i) => (
          <div key={i} className={`stat-card ${s.cls}`}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card dashboard-recent">
        <div className="dashboard-recent-header">
          <div className="dashboard-recent-title">📋 Pedidos Recentes</div>
          <Button variant="ghost" size="sm" onClick={onGoToOrders}>Ver todos →</Button>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <p>Nenhum pedido ainda. Crie o primeiro!</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Cliente</th>
                  <th>Venda</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(o => {
                  const cl   = clients.find(c => c.id === o.clientId);
                  const paid = o.paymentMode === "full"
                    ? o.depositPaid
                    : o.depositPaid && o.finalPaymentPaid;
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700 }}>{o.productName}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{cl?.name ?? "—"}</td>
                      <td style={{ fontWeight: 700, color: "var(--pink-dark)" }}>{fmt(o.salePrice)}</td>
                      <td><ShippingBadge status={o.shippingStatus} /></td>
                      <td><PaymentStatus paid={paid} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mini stats */}
      <div className="grid-3">
        {[
          { icon: "🚚", label: "Em Trânsito", value: inTransit, color: "var(--yellow)"  },
          { icon: "🗾", label: "No Brasil",   value: arrived,   color: "var(--purple)"  },
          { icon: "✅", label: "Entregues",   value: delivered,  color: "var(--green)"  },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.icon} {s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
