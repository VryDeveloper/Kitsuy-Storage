// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Type Definitions
// ─────────────────────────────────────────────────────────────

export type ShippingStatus =
  | "pending"
  | "ordered"
  | "in_transit"
  | "arrived_brazil"
  | "delivered";

export type PaymentMode  = "installment" | "full";
export type MarginType   = "fixed" | "double";

export interface Order {
  id: string;
  createdAt: string;

  // Produto
  productName:   string;
  purchasePrice: string;   // Custo do produto (JP)
  purchaseLink:  string;

  // Precificação (calculadora)
  shippingCost:  string;   // Frete internacional (R$75/80/90/120 ou livre)
  marginType:    MarginType;
  marginValue:   string;   // R$150 fixo ou 2x produto (calculado/editável)
  discountValue: string;   // Desconto aplicado sobre a margem
  salePrice:     string;   // Preço final ao cliente (auto-calculado ou manual)

  // Datas
  orderDate: string;

  // Cliente
  clientId: string;

  // Envio
  shippingStatus: ShippingStatus;

  // Pagamento
  paymentMode:      PaymentMode;
  depositPaid:      boolean;
  finalPaymentPaid: boolean;

  // Extra
  notes: string;
}

export interface Client {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
}

export interface FinancialStats {
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalReceived: number;
  totalPending: number;
}
