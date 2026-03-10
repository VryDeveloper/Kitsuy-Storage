// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Constants
// ─────────────────────────────────────────────────────────────

import type { ShippingStatus } from "../types";

export interface ShippingConfig {
  label: string;
  dot: string;
}

export const SHIPPING_CONFIG: Record<ShippingStatus, ShippingConfig> = {
  pending:        { label: "Aguardando",   dot: "#9ca3af" },
  ordered:        { label: "Encomendado",  dot: "#3b82f6" },
  in_transit:     { label: "Em Trânsito",  dot: "#f59e0b" },
  arrived_brazil: { label: "No Brasil",    dot: "#8b5cf6" },
  delivered:      { label: "Entregue",     dot: "#10b981" },
};

export const STORAGE_KEYS = {
  ORDERS:  "ks-orders",
  CLIENTS: "ks-clients",
} as const;
