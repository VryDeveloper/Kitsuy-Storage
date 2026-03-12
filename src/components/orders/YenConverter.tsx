// ─────────────────────────────────────────────────────────────
//  KitsuyStore — YenConverter
//  Converte JPY → BRL em tempo real via Frankfurter API
//  (gratuito, sem API key: api.frankfurter.dev)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { fmt } from "../../utils/formatters";
import "./YenConverter.css";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

interface YenConverterProps {
  /** Callback: passa o valor convertido em BRL para o formulário do pedido */
  onUseValue?: (brlValue: string) => void;
}

interface RateState {
  rate:    number | null;
  date:    string;
  loading: boolean;
  error:   string;
}

export function YenConverter({ onUseValue }: YenConverterProps) {
  const [jpy, setJpy]           = useState("");
  const [activeQuick, setActiveQuick] = useState<number | null>(null);
  const [rateState, setRateState] = useState<RateState>({
    rate: null, date: "", loading: true, error: "",
  });

  // Busca a cotação JPY→BRL
  const fetchRate = useCallback(async () => {
    setRateState(s => ({ ...s, loading: true, error: "" }));
    try {
      const res = await fetch(
        "https://api.frankfurter.dev/v1/latest?base=JPY&symbols=BRL"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRateState({
        rate:    data.rates?.BRL ?? null,
        date:    data.date ?? "",
        loading: false,
        error:   "",
      });
    } catch {
      setRateState({ rate: null, date: "", loading: false, error: "Falha ao buscar cotação." });
    }
  }, []);

  useEffect(() => {
    fetchRate();
    // Atualiza a cada 10 minutos
    const interval = setInterval(fetchRate, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  const jpyNum = parseFloat(jpy.replace(",", ".")) || 0;
  const brlNum = rateState.rate ? jpyNum * rateState.rate : 0;

  const handleQuick = (amount: number) => {
    setJpy(String(amount));
    setActiveQuick(amount);
  };

  const handleInput = (v: string) => {
    setJpy(v);
    setActiveQuick(null);
  };

  const fmtJPY = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  return (
    <div className="converter-panel">
      <div className="converter-title">💱 Conversor ¥ → R$</div>

      {/* Taxa atual */}
      {rateState.loading && (
        <div className="converter-status loading">⏳ Buscando cotação...</div>
      )}
      {rateState.error && (
        <div className="converter-status error">
          ⚠️ {rateState.error}
          <button
            onClick={fetchRate}
            style={{ marginLeft: 8, background: "none", border: "none",
              color: "var(--pink)", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem" }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {!rateState.loading && !rateState.error && rateState.rate && (
        <>
          <div className="converter-rate-badge">
            <span className="converter-rate-label">¥1 JPY =</span>
            <span className="converter-rate-value">R$ {rateState.rate.toFixed(4)}</span>
          </div>
          <div className="converter-rate-date">
            Cotação de {rateState.date} · Fonte: BCE
          </div>
        </>
      )}

      {/* Entrada JPY */}
      <div className="converter-input-group">
        <div className="converter-flag-label">
          <span className="converter-flag">🇯🇵</span> Valor em Yen
        </div>
        <div className="converter-input-wrapper">
          <span className="converter-currency-tag">¥ JPY</span>
          <input
            type="number"
            value={jpy}
            onChange={e => handleInput(e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      {/* Atalhos rápidos */}
      <div>
        <div className="converter-quick-label">Valores rápidos</div>
        <div className="converter-quick-btns">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              className={`converter-quick-btn${activeQuick === a ? " active" : ""}`}
              onClick={() => handleQuick(a)}
            >
              ¥{a.toLocaleString("ja-JP")}
            </button>
          ))}
        </div>
      </div>

      {/* Seta */}
      <div className="converter-arrow">⬇️</div>

      {/* Resultado BRL */}
      <div className="converter-result">
        <div className="converter-result-label">🇧🇷 Equivalente em Reais</div>
        <div className="converter-result-value">
          {brlNum > 0 ? fmt(brlNum) : "R$ —"}
        </div>
        {jpyNum > 0 && rateState.rate && (
          <div className="converter-result-sub">
            {fmtJPY(jpyNum)} → {fmt(brlNum)}
          </div>
        )}
      </div>

      {/* Botão usar valor */}
      {onUseValue && (
        <button
          className="converter-use-btn"
          disabled={brlNum <= 0 || !rateState.rate}
          onClick={() => onUseValue(brlNum.toFixed(2))}
        >
          ✦ Usar R$ {brlNum > 0 ? fmt(brlNum) : "—"} no pedido
        </button>
      )}
    </div>
  );
}
