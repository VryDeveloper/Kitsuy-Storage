// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Badge Component
// ─────────────────────────────────────────────────────────────

import type { ShippingStatus } from "../../types";
import { SHIPPING_CONFIG } from "../../utils/constants";

interface ShippingBadgeProps {
  status: ShippingStatus;
}

export function ShippingBadge({ status }: ShippingBadgeProps) {
  const cfg = SHIPPING_CONFIG[status] ?? SHIPPING_CONFIG.pending;
  return (
    <span
      className="badge"
      style={{
        color:       cfg.dot,
        borderColor: cfg.dot + "55",
        background:  cfg.dot + "15",
      }}
    >
      <span className="badge-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

interface PaymentStatusProps {
  paid: boolean;
  label?: string;
}

export function PaymentStatus({ paid, label }: PaymentStatusProps) {
  return (
    <span
      style={{
        color:      paid ? "var(--green)" : "var(--red)",
        fontWeight: 700,
        fontSize:   "0.8rem",
        whiteSpace: "nowrap",
      }}
    >
      {paid ? `✓ ${label ?? "Pago"}` : `● ${label ?? "Pendente"}`}
    </span>
  );
}
