// ─────────────────────────────────────────────────────────────
//  KitsuyStore — OrderModal (com Calculadora de Preço)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import type { Order, Client } from "../../types";
import { SHIPPING_CONFIG } from "../../utils/constants";
import { fmt, today } from "../../utils/formatters";
import {
  calcPricing,
  suggestedMargin,
  SHIPPING_PRESETS,
  PROXY_FIXED,
  PROXY_PERCENT,
} from "../../utils/pricing";
import { Button } from "../ui/Button";
import "./Orders.css";

type OrderFormData = Omit<Order, "id" | "createdAt">;

const EMPTY: OrderFormData = {
  productName:     "",
  clientId:        "",
  purchasePrice:   "",
  purchaseLink:    "",
  shippingCost:    "",
  marginType:      "fixed",
  marginValue:     "150",
  discountValue:   "0",
  salePrice:       "",
  orderDate:       today(),
  shippingStatus:  "pending",
  paymentMode:     "installment",
  depositPaid:     false,
  finalPaymentPaid: false,
  notes:           "",
};

interface OrderModalProps {
  mode: "add" | "edit";
  data?: Order;
  clients: Client[];
  onSave: (data: Order | OrderFormData) => void;
  onClose: () => void;
}

export function OrderModal({ mode, data, clients, onSave, onClose }: OrderModalProps) {
  const [f, setF] = useState<OrderFormData>({ ...EMPTY, ...data });
  const set = <K extends keyof OrderFormData>(key: K) => (value: OrderFormData[K]) =>
    setF(prev => ({ ...prev, [key]: value }));

  const purchasePrice = parseFloat(f.purchasePrice) || 0;
  const shippingCost  = parseFloat(f.shippingCost)  || 0;
  const marginValue   = parseFloat(f.marginValue)   || 0;
  const discountValue = parseFloat(f.discountValue) || 0;

  const breakdown = purchasePrice > 0
    ? calcPricing(purchasePrice, shippingCost, marginValue, discountValue)
    : null;

  // Atualiza margem sugerida ao trocar o tipo ou o preço de compra
  useEffect(() => {
    if (purchasePrice <= 0) return;
    const suggested = suggestedMargin(purchasePrice, f.marginType);
    setF(prev => ({ ...prev, marginValue: String(suggested) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.marginType, f.purchasePrice]);

  // Sincroniza o salePrice com o cálculo automático
  useEffect(() => {
    if (breakdown) {
      setF(prev => ({ ...prev, salePrice: breakdown.salePrice.toFixed(2) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.purchasePrice, f.shippingCost, f.marginValue, f.discountValue]);

  const handleSave = () => {
    if (!f.productName.trim()) { alert("Nome do produto é obrigatório."); return; }
    if (!purchasePrice)        { alert("Preço de compra é obrigatório."); return; }
    onSave(data ? { ...f, id: data.id, createdAt: data.createdAt } : f);
  };

  const saleNum = parseFloat(f.salePrice) || 0;
  const half    = saleNum * 0.5;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-title">
          {mode === "add" ? "🌸 Novo Pedido" : "✏️ Editar Pedido"}
        </div>

        <div className="form-group">

          {/* Produto */}
          <div className="form-field">
            <label>Produto *</label>
            <input
              value={f.productName}
              onChange={e => set("productName")(e.target.value)}
              placeholder="Ex: Figuarts Zero Zoro"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Cliente</label>
              <select value={f.clientId} onChange={e => set("clientId")(e.target.value)}>
                <option value="">Sem vínculo</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Data do Pedido</label>
              <input type="date" value={f.orderDate} onChange={e => set("orderDate")(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>🔗 Link de Compra</label>
              <input value={f.purchaseLink} onChange={e => set("purchaseLink")(e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-field">
              <label>🚚 Status de Envio</label>
              <select value={f.shippingStatus} onChange={e => set("shippingStatus")(e.target.value as Order["shippingStatus"])}>
                {Object.entries(SHIPPING_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Calculadora de Preço ── */}
          <div className="pricing-box">
            <div className="pricing-box-title">🧮 Calculadora de Preço</div>

            {/* Preço de compra */}
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label>💸 Preço de Compra (produto no Japão) *</label>
              <input
                type="number"
                step="0.01"
                value={f.purchasePrice}
                onChange={e => set("purchasePrice")(e.target.value)}
                placeholder="0,00"
              />
            </div>

            {/* Taxas proxy somente leitura */}
            {purchasePrice > 0 && (
              <div className="proxy-fees-row">
                <div className="proxy-fee-item">
                  <span className="proxy-fee-label">Taxa fixa TreasureBox</span>
                  <span className="proxy-fee-value">+ {fmt(PROXY_FIXED)}</span>
                </div>
                <div className="proxy-fee-item">
                  <span className="proxy-fee-label">
                    {Math.round(PROXY_PERCENT * 100)}% proxy (sobre R${fmt(purchasePrice + PROXY_FIXED)})
                  </span>
                  <span className="proxy-fee-value">
                    + {fmt((purchasePrice + PROXY_FIXED) * PROXY_PERCENT)}
                  </span>
                </div>
              </div>
            )}

            {/* Frete */}
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label>📦 Frete Internacional</label>
              <div className="shipping-presets">
                {SHIPPING_PRESETS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    className={`preset-btn${parseFloat(f.shippingCost) === p.value ? " active" : ""}`}
                    onClick={() => set("shippingCost")(String(p.value))}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.01"
                value={f.shippingCost}
                onChange={e => set("shippingCost")(e.target.value)}
                placeholder="Ou digite o valor do frete..."
                style={{ marginTop: 8 }}
              />
            </div>

            {/* Margem */}
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label>💰 Margem de Lucro</label>
              <div className="margin-toggle">
                <button
                  type="button"
                  className={`toggle-btn${f.marginType === "fixed" ? " active" : ""}`}
                  onClick={() => set("marginType")("fixed")}
                >
                  💵 Valor fixo
                </button>
                <button
                  type="button"
                  className={`toggle-btn${f.marginType === "double" ? " active" : ""}`}
                  onClick={() => set("marginType")("double")}
                >
                  ×2 Dobro do produto
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                value={f.marginValue}
                onChange={e => set("marginValue")(e.target.value)}
                placeholder="Valor da margem"
                style={{ marginTop: 8 }}
              />
              {f.marginType === "double" && purchasePrice > 0 && (
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 3 }}>
                  Sugerido: {fmt(purchasePrice * 2)} (2 × {fmt(purchasePrice)})
                </span>
              )}
            </div>

            {/* Desconto */}
            <div className="form-field" style={{ marginBottom: 16 }}>
              <label>🎁 Desconto sobre a margem (opcional)</label>
              <input
                type="number"
                step="0.01"
                value={f.discountValue}
                onChange={e => set("discountValue")(e.target.value)}
                placeholder="0,00"
              />
              {discountValue > 0 && marginValue > 0 && (
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 3 }}>
                  Margem real: {fmt(Math.max(0, marginValue - discountValue))}
                </span>
              )}
            </div>

            {/* Breakdown visual */}
            {breakdown && (
              <div className="pricing-breakdown">
                <div className="breakdown-row">
                  <span>Produto (JP)</span>
                  <span>{fmt(breakdown.purchasePrice)}</span>
                </div>
                <div className="breakdown-row">
                  <span>+ Taxa fixa proxy</span>
                  <span>{fmt(breakdown.proxyFixed)}</span>
                </div>
                <div className="breakdown-row">
                  <span>+ 8% proxy</span>
                  <span>{fmt(breakdown.proxyPercent)}</span>
                </div>
                <div className="breakdown-row">
                  <span>+ Frete</span>
                  <span>{fmt(breakdown.shippingCost)}</span>
                </div>
                <div className="breakdown-row breakdown-subtotal">
                  <span>= Custo total</span>
                  <span>{fmt(breakdown.totalCost)}</span>
                </div>
                <div className="breakdown-row">
                  <span>+ Margem</span>
                  <span>{fmt(breakdown.margin)}</span>
                </div>
                {breakdown.discount > 0 && (
                  <div className="breakdown-row breakdown-discount">
                    <span>− Desconto</span>
                    <span>{fmt(breakdown.discount)}</span>
                  </div>
                )}
                <div className="breakdown-row breakdown-total">
                  <span>💎 Preço ao cliente</span>
                  <span>{fmt(breakdown.salePrice)}</span>
                </div>
                <div className="breakdown-row breakdown-profit">
                  <span>📈 Seu lucro real</span>
                  <span style={{ color: breakdown.realProfit >= 0 ? "var(--green)" : "var(--red)" }}>
                    {fmt(breakdown.realProfit)}
                  </span>
                </div>
              </div>
            )}

            {/* Preço final editável */}
            <div className="form-field" style={{ marginTop: 14 }}>
              <label>🏷️ Preço Final ao Cliente</label>
              <input
                type="number"
                step="0.01"
                value={f.salePrice}
                onChange={e => set("salePrice")(e.target.value)}
                placeholder="Auto-calculado acima"
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                Calculado automaticamente — edite aqui se precisar ajustar.
              </span>
            </div>
          </div>

          {/* Pagamento */}
          <div className="payment-box">
            <div className="payment-box-label">💳 Pagamento</div>
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label>Modalidade</label>
              <select value={f.paymentMode} onChange={e => set("paymentMode")(e.target.value as Order["paymentMode"])}>
                <option value="installment">Parcelado — 50% sinal + 50% ao chegar no Brasil</option>
                <option value="full">À vista — Pagamento total</option>
              </select>
            </div>

            {f.paymentMode === "installment" ? (
              <>
                <div className="checkbox-row" onClick={() => set("depositPaid")(!f.depositPaid)}>
                  <input type="checkbox" checked={f.depositPaid} readOnly />
                  <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>
                    Sinal recebido — <strong style={{ color: "var(--pink)" }}>{fmt(half)}</strong>
                  </span>
                </div>
                <div className="checkbox-row" style={{ marginBottom: 0 }} onClick={() => set("finalPaymentPaid")(!f.finalPaymentPaid)}>
                  <input type="checkbox" checked={f.finalPaymentPaid} readOnly />
                  <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>
                    Restante ao chegar no Brasil — <strong style={{ color: "var(--pink)" }}>{fmt(half)}</strong>
                  </span>
                </div>
              </>
            ) : (
              <div className="checkbox-row" style={{ marginBottom: 0 }} onClick={() => set("depositPaid")(!f.depositPaid)}>
                <input type="checkbox" checked={f.depositPaid} readOnly />
                <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>
                  Pago na íntegra — <strong style={{ color: "var(--pink)" }}>{fmt(saleNum)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="form-field">
            <label>📝 Observações</label>
            <textarea
              value={f.notes}
              onChange={e => set("notes")(e.target.value)}
              rows={2}
              placeholder="Anotações extras..."
            />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave}>
              {mode === "add" ? "🌸 Criar Pedido" : "💾 Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
