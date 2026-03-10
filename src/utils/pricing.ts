// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Pricing Calculator
//
//  Fórmula:
//    base       = purchasePrice
//    proxyFixed = R$ 3,27
//    proxyPct   = 8% de (purchasePrice + proxyFixed)
//    totalCost  = base + proxyFixed + proxyPct + shippingCost
//    margin     = marginType === "fixed"  → marginValue
//                 marginType === "double" → purchasePrice × 2
//    salePrice  = totalCost + margin − discount
//    realProfit = margin − discount
// ─────────────────────────────────────────────────────────────

export const PROXY_FIXED   = 3.27;
export const PROXY_PERCENT = 0.08;

export const SHIPPING_PRESETS = [
  { label: "R$ 75",  value: 75  },
  { label: "R$ 80",  value: 80  },
  { label: "R$ 90",  value: 90  },
  { label: "R$ 120", value: 120 },
];

export interface PricingBreakdown {
  purchasePrice: number;
  proxyFixed:    number;
  proxyPercent:  number;
  shippingCost:  number;
  totalCost:     number;
  margin:        number;
  discount:      number;
  salePrice:     number;
  realProfit:    number;
}

export function calcPricing(
  purchasePrice: number,
  shippingCost:  number,
  marginValue:   number,
  discountValue: number,
): PricingBreakdown {
  const proxyFixed   = PROXY_FIXED;
  const proxyPercent = (purchasePrice + proxyFixed) * PROXY_PERCENT;
  const totalCost    = purchasePrice + proxyFixed + proxyPercent + shippingCost;
  const margin       = marginValue;
  const discount     = Math.min(discountValue, margin); // desconto não pode exceder a margem
  const salePrice    = totalCost + margin - discount;
  const realProfit   = margin - discount;

  return {
    purchasePrice,
    proxyFixed,
    proxyPercent,
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
  return marginType === "double" ? purchasePrice * 2 : fixedAmount;
}
