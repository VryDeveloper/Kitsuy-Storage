// ─────────────────────────────────────────────────────────────
//  KitsuyStore — OrdersTab Component
// ─────────────────────────────────────────────────────────────

import type { Order, Client } from "../../types";
import { SHIPPING_CONFIG } from "../../utils/constants";
import { fmt, fmtDate } from "../../utils/formatters";
import { ShippingBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import "./Orders.css";

interface OrdersTabProps {
  orders: Order[];
  clients: Client[];
  search: string;
  setSearch: (v: string) => void;
  shippingFilter: string;
  setShippingFilter: (v: string) => void;
  onAdd: () => void;
  onEdit: (o: Order) => void;
  onDelete: (id: string) => void;
}

export function OrdersTab({
  orders, clients,
  search, setSearch,
  shippingFilter, setShippingFilter,
  onAdd, onEdit, onDelete,
}: OrdersTabProps) {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pedidos <span>✦</span></h1>
        <Button variant="primary" onClick={onAdd}>+ Novo Pedido</Button>
      </div>

      <div className="filter-row">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Buscar produto ou cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={shippingFilter}
          onChange={e => setShippingFilter(e.target.value)}
          style={{ width: 200, borderRadius: "var(--radius-pill)" }}
        >
          <option value="all">Todos os status</option>
          {Object.entries(SHIPPING_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <p>Nenhum pedido encontrado.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Custo</th>
                <th>Venda</th>
                <th>Lucro</th>
                <th>Envio</th>
                <th>Pagamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const cl     = clients.find(c => c.id === o.clientId);
                const cost   = parseFloat(o.purchasePrice) || 0;
                const sale   = parseFloat(o.salePrice) || 0;
                const margin = parseFloat(o.marginValue) || 0;
                const discount = parseFloat(o.discountValue) || 0;
                const profit = margin - discount;

                let payLabel = "Não pago";
                let payColor = "var(--red)";
                if (o.paymentMode === "full" && o.depositPaid) {
                  payLabel = "Pago"; payColor = "var(--green)";
                } else if (o.paymentMode === "installment") {
                  if (o.depositPaid && o.finalPaymentPaid) { payLabel = "Pago total"; payColor = "var(--green)"; }
                  else if (o.depositPaid)                  { payLabel = "Sinal pago"; payColor = "var(--yellow)"; }
                }

                return (
                  <tr key={o.id}>
                    <td>
                      <div className="order-product-name">{o.productName}</div>
                      {o.purchaseLink && (
                        <a href={o.purchaseLink} target="_blank" rel="noopener noreferrer" className="order-link">🔗 link</a>
                      )}
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{cl?.name ?? "—"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{fmtDate(o.orderDate)}</td>
                    <td style={{ color: "var(--text-muted)" }}>{fmt(cost)}</td>
                    <td style={{ fontWeight: 700, color: "var(--pink-dark)" }}>{fmt(sale)}</td>
                    <td>
                      <span
                        className="profit-pill"
                        style={{
                          background: profit >= 0 ? "var(--green-bg)"      : "#fef2f2",
                          color:      profit >= 0 ? "var(--green)"          : "var(--red)",
                          border:     `1.5px solid ${profit >= 0 ? "var(--green-border)" : "#fecaca"}`,
                        }}
                      >
                        {fmt(profit)}
                      </span>
                    </td>
                    <td><ShippingBadge status={o.shippingStatus} /></td>
                    <td style={{ fontWeight: 700, fontSize: "0.8rem", color: payColor, whiteSpace: "nowrap" }}>{payLabel}</td>
                    <td>
                      <div className="actions-group">
                        <Button variant="ghost"  size="sm" onClick={() => onEdit(o)}>✏️</Button>
                        <Button variant="danger" size="sm" onClick={() => { if (confirm("Remover este pedido?")) onDelete(o.id); }}>🗑</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
