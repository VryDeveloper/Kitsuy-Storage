// ─────────────────────────────────────────────────────────────
//  KitsuyStore — ReceiptsTab Component
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import type { PaymentReceipt, Client, Order } from "../../types";
import { fmt, fmtDate } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { openReceiptFile, receiptIcon } from "./receiptFile";
import "./Receipts.css";

interface ReceiptsTabProps {
  receipts: PaymentReceipt[];
  clients: Client[];
  orders: Order[];
  onAdd: () => void;
  onEdit: (r: PaymentReceipt) => void;
  onDelete: (r: PaymentReceipt) => void;
}

export function ReceiptsTab({ receipts, clients, orders, onAdd, onEdit, onDelete }: ReceiptsTabProps) {
  const [search, setSearch] = useState("");

  const clientName = (id: string) => clients.find(c => c.id === id)?.name ?? "—";
  const orderName  = (id: string) => orders.find(o => o.id === id)?.productName ?? "—";

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return receipts;
    return receipts.filter(r =>
      r.fileName.toLowerCase().includes(s) ||
      r.notes.toLowerCase().includes(s) ||
      r.clientIds.some(id => clientName(id).toLowerCase().includes(s)) ||
      r.orderIds.some(id => orderName(id).toLowerCase().includes(s))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipts, clients, orders, search]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Comprovantes <span>✦</span></h1>
        <Button variant="primary" onClick={onAdd}>+ Novo Comprovante</Button>
      </div>

      <div className="filter-row">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Buscar por cliente, produto ou arquivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">🧾</span>
            <p>Nenhum comprovante encontrado.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Clientes</th>
                <th>Pedidos</th>
                <th>Valor</th>
                <th>Data</th>
                <th>Enviado por</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <button type="button" className="receipt-file-link" onClick={() => openReceiptFile(r)} title="Abrir comprovante">
                      {receiptIcon(r.fileType)} {r.fileName}
                    </button>
                    {r.notes && <div className="receipt-pick-meta">{r.notes}</div>}
                  </td>
                  <td style={{ fontSize: "0.82rem" }}>{r.clientIds.map(clientName).join(", ")}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {r.orderIds.length ? r.orderIds.map(orderName).join(", ") : "—"}
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--pink-dark)", whiteSpace: "nowrap" }}>
                    {r.amount ? fmt(r.amount) : "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{fmtDate(r.paymentDate)}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{r.createdByName || "—"}</td>
                  <td>
                    <div className="actions-group">
                      <Button variant="ghost"  size="sm" onClick={() => onEdit(r)}>✏️</Button>
                      <Button variant="danger" size="sm" onClick={() => { if (confirm("Remover este comprovante? O arquivo será apagado.")) onDelete(r); }}>🗑</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
