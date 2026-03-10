// ─────────────────────────────────────────────────────────────
//  KitsuyStore — ViewClientModal Component
// ─────────────────────────────────────────────────────────────

import type { Client, Order } from "../../types";
import { fmt, fmtDate } from "../../utils/formatters";
import { ShippingBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import "./Clients.css";

interface ViewClientModalProps {
  client: Client;
  orders: Order[];
  onClose: () => void;
  onEdit: () => void;
}

export function ViewClientModal({ client, orders, onClose, onEdit }: ViewClientModalProps) {
  const totalSpent = orders.reduce((s, o) => s + (parseFloat(o.salePrice) || 0), 0);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="view-modal-header">
          <div className="modal-title" style={{ margin: 0 }}>👤 {client.name}</div>
          <div style={{ display: "flex", gap: 7 }}>
            <Button variant="ghost" size="sm" onClick={onEdit}>✏️ Editar</Button>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 14 }}>
          {client.phone && (
            <div className="stat-card" style={{ padding: 14 }}>
              <div className="stat-label">WhatsApp</div>
              <div style={{ fontWeight: 600, fontSize: "0.87rem" }}>{client.phone}</div>
            </div>
          )}
          {client.address && (
            <div className="stat-card" style={{ padding: 14 }}>
              <div className="stat-label">Endereço</div>
              <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{client.address}</div>
            </div>
          )}
        </div>

        {client.notes && (
          <div style={{ background: "var(--pink-pale)", border: "2px solid var(--border)", borderRadius: 10, padding: 11, marginBottom: 14, color: "var(--text-muted)", fontSize: "0.83rem", fontWeight: 500 }}>
            📝 {client.notes}
          </div>
        )}

        <div className="order-history-title">
          Histórico de Pedidos ({orders.length}) · Total:{" "}
          <span style={{ color: "var(--pink)" }}>{fmt(totalSpent)}</span>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <span className="empty-icon">📦</span>
            <p>Nenhum pedido vinculado.</p>
          </div>
        ) : (
          <div>
            {orders.map(o => {
              const paid = o.paymentMode === "full"
                ? o.depositPaid
                : o.depositPaid && o.finalPaymentPaid;
              return (
                <div key={o.id} className="order-history-item">
                  <div>
                    <div className="order-history-name">{o.productName}</div>
                    <div className="order-history-date">{fmtDate(o.orderDate)}</div>
                  </div>
                  <div className="order-history-right">
                    <ShippingBadge status={o.shippingStatus} />
                    <span style={{ fontWeight: 700, color: "var(--pink-dark)", fontSize: "0.88rem" }}>{fmt(o.salePrice)}</span>
                    <span style={{ color: paid ? "var(--green)" : "var(--red)", fontSize: "0.78rem", fontWeight: 700 }}>
                      {paid ? "✓ Pago" : "● Pendente"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
