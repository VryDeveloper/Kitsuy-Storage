// ─────────────────────────────────────────────────────────────
//  KitsuyStore — ReceiptModal (comprovante de pagamento)
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useMemo } from "react";
import type { PaymentReceipt, ReceiptFormData, Client, Order } from "../../types";
import { fmt, fmtDate, today } from "../../utils/formatters";
import { RECEIPT_ALLOWED_TYPES } from "../../services/storage";
import { Button } from "../ui/Button";
import { openReceiptFile, receiptIcon } from "./receiptFile";
import "./Receipts.css";

const EMPTY: ReceiptFormData = {
  amount:      "",
  paymentDate: today(),
  notes:       "",
  clientIds:   [],
  orderIds:    [],
};

interface ReceiptModalProps {
  mode: "add" | "edit";
  data?: PaymentReceipt;
  initial?: Partial<ReceiptFormData>;   // Pré-seleção (ex.: aberto a partir de um pedido)
  clients: Client[];
  orders: Order[];
  onSave: (file: File | null, data: PaymentReceipt | ReceiptFormData) => Promise<void>;
  onClose: () => void;
}

export function ReceiptModal({ mode, data, initial, clients, orders, onSave, onClose }: ReceiptModalProps) {
  const [f, setF] = useState<ReceiptFormData>({ ...EMPTY, ...initial, ...data });
  const set = <K extends keyof ReceiptFormData>(key: K) => (value: ReceiptFormData[K]) =>
    setF(prev => ({ ...prev, [key]: value }));

  const [file, setFile]         = useState<File | null>(null);
  const [fileError, setFileErr] = useState("");
  const [saving, setSaving]     = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = (picked: File | undefined | null) => {
    if (!picked) return;
    if (!RECEIPT_ALLOWED_TYPES.includes(picked.type)) {
      setFileErr("Formato inválido. Use PDF, PNG ou JPG.");
      return;
    }
    setFileErr("");
    setFile(picked);
  };

  const toggleClient = (id: string) => {
    setF(prev => {
      if (prev.clientIds.includes(id)) {
        // Ao desmarcar o cliente, desmarca também os pedidos dele
        const clientOrders = new Set(orders.filter(o => o.clientId === id).map(o => o.id));
        return {
          ...prev,
          clientIds: prev.clientIds.filter(c => c !== id),
          orderIds:  prev.orderIds.filter(o => !clientOrders.has(o)),
        };
      }
      return { ...prev, clientIds: [...prev.clientIds, id] };
    });
  };

  const toggleOrder = (id: string) =>
    set("orderIds")(f.orderIds.includes(id) ? f.orderIds.filter(o => o !== id) : [...f.orderIds, id]);

  const visibleClients = useMemo(() => {
    const s = clientSearch.toLowerCase();
    return clients.filter(c =>
      f.clientIds.includes(c.id) || !s || c.name.toLowerCase().includes(s) || c.phone?.includes(s)
    );
  }, [clients, clientSearch, f.clientIds]);

  // Só pedidos dos clientes selecionados podem ser vinculados
  const availableOrders = useMemo(
    () => orders.filter(o => f.clientIds.includes(o.clientId)),
    [orders, f.clientIds]
  );

  const selectedOrdersTotal = orders
    .filter(o => f.orderIds.includes(o.id))
    .reduce((s, o) => s + (parseFloat(o.salePrice) || 0), 0);

  const handleSave = async () => {
    if (mode === "add" && !file)   { setFileErr("Selecione o arquivo do comprovante."); return; }
    if (f.clientIds.length === 0)  { alert("Vincule pelo menos um cliente ao comprovante."); return; }

    setSaving(true);
    try {
      await onSave(file, data ? { ...data, ...f } : f);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-title">
          {mode === "add" ? "🧾 Novo Comprovante" : "✏️ Editar Comprovante"}
        </div>

        <div className="form-group">

          {/* Arquivo */}
          <div className="form-field">
            <label>📎 Arquivo {mode === "add" && "*"}</label>
            {mode === "edit" && data ? (
              <button type="button" className="receipt-file-link" onClick={() => openReceiptFile(data)}>
                {receiptIcon(data.fileType)} {data.fileName}
              </button>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  style={{ display: "none" }}
                  onChange={e => handleFilePick(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="image-upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? (
                    <>
                      <span className="image-upload-icon">{receiptIcon(file.type)}</span>
                      <span>{file.name}</span>
                      <span className="image-upload-hint">Clique para trocar</span>
                    </>
                  ) : (
                    <>
                      <span className="image-upload-icon">🧾</span>
                      <span>Clique para enviar o comprovante</span>
                      <span className="image-upload-hint">PDF, PNG ou JPG — até 10MB</span>
                    </>
                  )}
                </button>
              </>
            )}
            {fileError && <span style={{ fontSize: "0.75rem", color: "var(--red)" }}>{fileError}</span>}
          </div>

          {/* Clientes */}
          <div className="form-field">
            <label>👤 Clientes * <span className="receipt-label-hint">(pelo menos um)</span></label>
            {clients.length > 6 && (
              <input
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                placeholder="Buscar cliente..."
              />
            )}
            <div className="receipt-pick-list">
              {clients.length === 0 && (
                <div className="receipt-pick-empty">Cadastre um cliente antes de enviar comprovantes.</div>
              )}
              {visibleClients.map(c => (
                <label key={c.id} className="receipt-pick-item">
                  <input type="checkbox" checked={f.clientIds.includes(c.id)} onChange={() => toggleClient(c.id)} />
                  <span>{c.name}</span>
                  {c.phone && <span className="receipt-pick-meta">{c.phone}</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Pedidos */}
          <div className="form-field">
            <label>📦 Pedidos pagos por este comprovante</label>
            <div className="receipt-pick-list">
              {f.clientIds.length === 0 ? (
                <div className="receipt-pick-empty">Selecione um cliente para ver os pedidos dele.</div>
              ) : availableOrders.length === 0 ? (
                <div className="receipt-pick-empty">Os clientes selecionados não têm pedidos.</div>
              ) : availableOrders.map(o => (
                <label key={o.id} className="receipt-pick-item">
                  <input type="checkbox" checked={f.orderIds.includes(o.id)} onChange={() => toggleOrder(o.id)} />
                  <span>{o.productName}</span>
                  <span className="receipt-pick-meta">
                    {clients.find(c => c.id === o.clientId)?.name} · {fmtDate(o.orderDate)} · {fmt(o.salePrice)}
                  </span>
                </label>
              ))}
            </div>
            {f.orderIds.length > 0 && (
              <span className="receipt-label-hint">
                {f.orderIds.length} pedido(s) selecionado(s) · Total dos pedidos: {fmt(selectedOrdersTotal)}
              </span>
            )}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>💵 Valor pago</label>
              <input
                type="number"
                step="0.01"
                value={f.amount}
                onChange={e => set("amount")(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="form-field">
              <label>📅 Data do pagamento</label>
              <input type="date" value={f.paymentDate} onChange={e => set("paymentDate")(e.target.value)} />
            </div>
          </div>

          <div className="form-field">
            <label>📝 Observações</label>
            <textarea
              value={f.notes}
              onChange={e => set("notes")(e.target.value)}
              rows={2}
              placeholder="Ex: sinal via PIX"
            />
          </div>

          {mode === "edit" && data && (
            <div className="receipt-label-hint">
              Enviado por <strong>{data.createdByName || "—"}</strong> em {new Date(data.createdAt).toLocaleString("pt-BR")}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "⏳ Salvando..." : mode === "add" ? "🧾 Enviar Comprovante" : "💾 Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
