// ─────────────────────────────────────────────────────────────
//  KitsuyStore — ClientsTab Component
// ─────────────────────────────────────────────────────────────

import type { Client, Order } from "../../types";
import { fmt } from "../../utils/formatters";
import { Button } from "../ui/Button";
import "./Clients.css";

interface ClientsTabProps {
  clients: Client[];
  orders: Order[];
  search: string;
  setSearch: (v: string) => void;
  onAdd: () => void;
  onEdit: (c: Client) => void;
  onDelete: (id: string) => void;
  onView: (c: Client) => void;
}

export function ClientsTab({ clients, orders, search, setSearch, onAdd, onEdit, onDelete, onView }: ClientsTabProps) {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Clientes <span>✦</span></h1>
        <Button variant="primary" onClick={onAdd}>+ Novo Cliente</Button>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">👤</span>
            <p>Nenhum cliente cadastrado ainda.</p>
          </div>
        </div>
      ) : (
        <div className="clients-grid">
          {clients.map(c => {
            const co    = orders.filter(o => o.clientId === c.id);
            const spent = co.reduce((s, o) => s + (parseFloat(o.salePrice) || 0), 0);
            return (
              <div key={c.id} className="client-card">
                <div className="client-card-header">
                  <div>
                    <div className="client-name">{c.name}</div>
                    {c.phone && <div className="client-phone">📱 {c.phone}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Button variant="ghost"  size="sm" onClick={() => onView(c)}>👁</Button>
                    <Button variant="ghost"  size="sm" onClick={() => onEdit(c)}>✏️</Button>
                    <Button variant="danger" size="sm" onClick={() => { if (confirm("Remover cliente? Pedidos vinculados serão mantidos.")) onDelete(c.id); }}>🗑</Button>
                  </div>
                </div>

                {c.address && <div className="client-address">📍 {c.address}</div>}

                <div className="divider" />

                <div className="client-footer">
                  <div>
                    <div className="client-stat-label">Pedidos</div>
                    <div className="client-stat-value">{co.length}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="client-stat-label">Total Gasto</div>
                    <div className="client-stat-value" style={{ color: "var(--pink-dark)", fontSize: "1.05rem" }}>{fmt(spent)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
