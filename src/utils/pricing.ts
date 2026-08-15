// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Pricing Calculator
//
//  Fórmula:
//    baseConversaoYen    = purchasePriceYen + PROXY_FIXED_JPY
//    custoConversaoReais = baseConversaoYen × exchangeRate × (1 + wiseFeePercent)
//    totalCost           = custoConversaoReais + shippingCost
//    margin              = marginType === "fixed"  → marginValue
//                          marginType === "double" → purchasePrice × 2
//    salePrice           = totalCost + margin − discount
//    realProfit          = margin − discount
// ─────────────────────────────────────────────────────────────

export const PROXY_FIXED   = 3.27; // R$ — taxa fixa legado (referência histórica)
export const PROXY_FIXED_JPY = 200; // ¥ — taxa fixa do proxy, em ienes
export const WISE_FEE_PERCENT_DEFAULT = 0.0385; // 3.85% sugerido — editável pelo usuário na tela

export const SHIPPING_PRESETS = [
  { label: "R$ 75",  value: 75  },
  { label: "R$ 80",  value: 80  },
  { label: "R$ 90",  value: 90  },
  { label: "R$ 120", value: 120 },
];

export interface PricingBreakdown {
  purchasePriceYen:   number;
  proxyFixedJpy:       number;
  exchangeRateUsed:    number;
  wiseFeePercentUsed:  number;
  conversionCost:      number;
  shippingCost:        number;
  totalCost:           number;
  margin:              number;
  discount:            number;
  salePrice:           number;
  realProfit:          number;
}

export function calcPricing(
  purchasePriceYen: number,
  exchangeRate:      number,
  wiseFeePercent:    number,
  shippingCost:       number,
  marginValue:        number,
  discountValue:      number,
): PricingBreakdown {
  const proxyFixedJpy     = PROXY_FIXED_JPY;
  const baseConversionYen = purchasePriceYen + proxyFixedJpy;
  const conversionCost    = baseConversionYen * exchangeRate * (1 + wiseFeePercent);
  const totalCost         = conversionCost + shippingCost;
  const margin            = marginValue;
  const discount          = Math.min(discountValue, margin); // desconto não pode exceder a margem
  const salePrice         = totalCost + margin - discount;
  const realProfit        = margin - discount;

  return {
    purchasePriceYen,
    proxyFixedJpy,
    exchangeRateUsed: exchangeRate,
    wiseFeePercentUsed: wiseFeePercent,
    conversionCost,
    shippingCost,
    totalCost,
    margin,
    discount,
    salePrice,
    realProfit,
  };
}

/** Retorna a margem sugerida conforme o tipo escolhido */
export function suggestedMargin(
  purchasePrice: number,
  marginType: "fixed" | "double",
  fixedAmount = 150,
): number {
  return marginType === "double" ? purchasePrice : fixedAmount;
}
