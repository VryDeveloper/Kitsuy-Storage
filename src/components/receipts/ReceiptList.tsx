// ─────────────────────────────────────────────────────────────
//  KitsuyStore — ReceiptList (lista compacta para pedido/cliente)
// ─────────────────────────────────────────────────────────────

import type { PaymentReceipt } from "../../types";
import { fmt, fmtDate } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { openReceiptFile, receiptIcon } from "./receiptFile";
import "./Receipts.css";

interface ReceiptListProps {
  receipts: PaymentReceipt[];
  onAdd?: () => void;
  onEdit?: (r: PaymentReceipt) => void;
}

export function ReceiptList({ receipts, onAdd, onEdit }: ReceiptListProps) {
  return (
    <div className="receipt-list">
      <div className="receipt-list-header">
        <span className="payment-box-label" style={{ margin: 0 }}>🧾 Comprovantes ({receipts.length})</span>
        {onAdd && <Button size="sm" variant="ghost" onClick={onAdd}>+ Anexar</Button>}
      </div>
      {receipts.length === 0 ? (
        <div className="receipt-pick-empty">Nenhum comprovante anexado.</div>
      ) : receipts.map(r => (
        <div key={r.id} className="receipt-list-item">
          <button type="button" className="receipt-file-link" onClick={() => openReceiptFile(r)} title="Abrir comprovante">
            {receiptIcon(r.fileType)} {r.fileName}
          </button>
          <span className="receipt-pick-meta">
            {r.paymentDate ? fmtDate(r.paymentDate) : "—"}
            {r.amount && <> · <strong>{fmt(r.amount)}</strong></>}
          </span>
          {onEdit && <Button size="sm" variant="ghost" onClick={() => onEdit(r)}>✏️</Button>}
        </div>
      ))}
    </div>
  );
}
