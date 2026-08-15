// ─────────────────────────────────────────────────────────────
//  KitsuyStore — OrderModal (com Calculadora de Preço)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import type { Order, Client } from "../../types";
import { SHIPPING_CONFIG } from "../../utils/constants";
import { fmt, today } from "../../utils/formatters";
import {
  calcPricing,
  suggestedMargin,
  SHIPPING_PRESETS,
  PROXY_FIXED_JPY,
  WISE_FEE_PERCENT_DEFAULT,
} from "../../utils/pricing";
import { ImageService } from "../../services/storage";
import { Button } from "../ui/Button";
import { YenConverter } from "./YenConverter";
import "./Orders.css";

type OrderFormData = Omit<Order, "id" | "createdAt">;

const EMPTY: OrderFormData = {
  productName:     "",
  clientId:        "",
  purchasePrice:   "",
  purchaseLink:    "",
  imageUrl:        "",
  purchasePriceYen: "",
  exchangeRate:     "",
  wiseFeePercent:   String(WISE_FEE_PERCENT_DEFAULT * 100),
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
  const [f, setF] = useState<OrderFormData>({
    ...EMPTY,
    ...data,
    wiseFeePercent: data?.wiseFeePercent ?? EMPTY.wiseFeePercent,
  });
  const set = <K extends keyof OrderFormData>(key: K) => (value: OrderFormData[K]) =>
    setF(prev => ({ ...prev, [key]: value }));

  // Conversão automática e bidirecional entre Preço de Compra (R$) e Valor em Yen (¥)
  const handlePurchasePriceChange = (value: string) => {
    setF(prev => {
      const next = { ...prev, purchasePrice: value };
      if (liveExchangeRate) {
        const brl = parseFloat(value);
        next.purchasePriceYen = brl > 0 ? (brl / liveExchangeRate).toFixed(2) : "";
      }
      return next;
    });
  };

  const handlePurchasePriceYenChange = (value: string) => {
    setF(prev => {
      const next = { ...prev, purchasePriceYen: value };
      if (liveExchangeRate) {
        const yen = parseFloat(value);
        next.purchasePrice = yen > 0 ? (yen * liveExchangeRate).toFixed(2) : "";
      }
      return next;
    });
  };

  // ── Upload de imagem do produto ──
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(f.imageUrl || "");
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (file: File | undefined | null) => {
    if (!file) return;
    setUploadError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    set("imageUrl")("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const purchasePrice    = parseFloat(f.purchasePrice)    || 0;
  const purchasePriceYen = parseFloat(f.purchasePriceYen || "") || 0;
  const wiseFeePercent   = (parseFloat(f.wiseFeePercent  || "") || 0) / 100;
  const shippingCost     = parseFloat(f.shippingCost)      || 0;
  const marginValue      = parseFloat(f.marginValue)       || 0;
  const discountValue    = parseFloat(f.discountValue)     || 0;

  // Cotação JPY→BRL atual, vinda do YenConverter (via onRateChange)
  const [liveExchangeRate, setLiveExchangeRate] = useState<number | null>(
    f.exchangeRate ? parseFloat(f.exchangeRate) : null
  );

  const breakdown = purchasePriceYen > 0 && liveExchangeRate
    ? calcPricing(purchasePriceYen, liveExchangeRate, wiseFeePercent, shippingCost, marginValue, discountValue)
    : null;

  // Guarda a cotação usada junto ao pedido (auditoria)
  useEffect(() => {
    if (liveExchangeRate) {
      setF(prev => ({ ...prev, exchangeRate: String(liveExchangeRate) }));
    }
  }, [liveExchangeRate]);

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
  }, [f.purchasePriceYen, f.wiseFeePercent, f.shippingCost, f.marginValue, f.discountValue, liveExchangeRate]);

  const handleSave = async () => {
    if (!f.productName.trim()) { alert("Nome do produto é obrigatório."); return; }
    if (!purchasePrice)        { alert("Preço de compra é obrigatório."); return; }

    let finalData = f;

    if (imageFile) {
      setUploading(true);
      setUploadError("");
      try {
        const url = await ImageService.upload(imageFile);
        finalData = { ...f, imageUrl: url };
      } catch (err: any) {
        setUploading(false);
        setUploadError(err?.message || "Erro ao enviar imagem.");
        return;
      }
      setUploading(false);
    }

    onSave(data ? { ...finalData, id: data.id, createdAt: data.createdAt } : finalData);
  };

  const saleNum = parseFloat(f.salePrice) || 0;
  const half    = saleNum * 0.5;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      {/* Wrapper side-by-side: modal à esquerda, conversor à direita */}
      <div style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        width: "100%",
        maxWidth: mode === "add" ? 940 : 600,
        maxHeight: "92vh",
      }}>
        {/* Modal principal */}
        <div className="modal" style={{ flex: 1, minWidth: 0 }}>
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

          {/* Imagem do item */}
          <div className="form-field">
            <label>🖼️ Imagem do Item</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={e => handleImagePick(e.target.files?.[0])}
            />
            {imagePreview ? (
              <div className="image-upload-preview">
                <img src={imagePreview} alt="Prévia do item" />
                <div className="image-upload-preview-actions">
                  <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Trocar
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={handleRemoveImage}>
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="image-upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="image-upload-icon">📷</span>
                <span>Clique para enviar uma foto do item</span>
                <span className="image-upload-hint">JPG, PNG, WEBP ou GIF — até 5MB</span>
              </button>
            )}
            {uploadError && <span style={{ fontSize: "0.75rem", color: "var(--red)" }}>{uploadError}</span>}
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

            {/* Preço de compra (R$ — usado apenas para sugerir a margem) */}
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label>💸 Preço de Compra em R$ (referência para margem) *</label>
              <input
                type="number"
                step="0.01"
                value={f.purchasePrice}
                onChange={e => handlePurchasePriceChange(e.target.value)}
                placeholder="0,00"
              />
            </div>

            {/* Valor do item em Yen — base da conversão WISE */}
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label>💴 Valor do Item em Yen (¥)</label>
              <input
                type="number"
                step="0.01"
                value={f.purchasePriceYen}
                onChange={e => handlePurchasePriceYenChange(e.target.value)}
                placeholder="0"
              />
              {!liveExchangeRate && (
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 3 }}>
                  Aguardando cotação para converter automaticamente...
                </span>
              )}
            </div>

            {/* Taxa WISE sobre a conversão JPY→BRL */}
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label>🔁 Taxa WISE (%)</label>
              <input
                type="number"
                step="0.01"
                value={f.wiseFeePercent}
                onChange={e => set("wiseFeePercent")(e.target.value)}
                placeholder={String(WISE_FEE_PERCENT_DEFAULT * 100)}
              />
              {!liveExchangeRate && (
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 3 }}>
                  Aguardando cotação do conversor ao lado...
                </span>
              )}
            </div>

            {/* Taxa fixa proxy somente leitura (¥, incluída na conversão) */}
            {purchasePriceYen > 0 && (
              <div className="proxy-fees-row">
                <div className="proxy-fee-item">
                  <span className="proxy-fee-label">Taxa fixa proxy</span>
                  <span className="proxy-fee-value">+ ¥{PROXY_FIXED_JPY}</span>
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
                  <span>¥{breakdown.purchasePriceYen.toFixed(2)}</span>
                </div>
                <div className="breakdown-row">
                  <span>
                    Câmbio usado (R$ {breakdown.exchangeRateUsed.toFixed(4)}) + Taxa WISE ({(breakdown.wiseFeePercentUsed * 100).toFixed(2)}%)
                  </span>
                  <span>{fmt(breakdown.conversionCost)}</span>
                </div>
                <div className="breakdown-row">
                  <span>+ Taxa fixa proxy (¥{breakdown.proxyFixedJpy} incluso na conversão)</span>
                  <span>{fmt(breakdown.proxyFixedJpy * breakdown.exchangeRateUsed)}</span>
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
            <Button variant="ghost" onClick={onClose} disabled={uploading}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={uploading}>
              {uploading ? "⏳ Enviando imagem..." : mode === "add" ? "🌸 Criar Pedido" : "💾 Salvar"}
            </Button>
          </div>
        </div>
      </div>

        {/* Conversor de Yen — só no modo "add" */}
        {mode === "add" && (
          <YenConverter
            onUseValue={(brl) => set("purchasePrice")(brl)}
            onUseYenValue={(yen) => set("purchasePriceYen")(yen)}
            onRateChange={setLiveExchangeRate}
          />
        )}
      </div>
    </div>
  );
}
