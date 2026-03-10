// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Button Component
// ─────────────────────────────────────────────────────────────

import type { ReactNode, MouseEventHandler } from "react";

type Variant = "primary" | "ghost" | "danger" | "success";

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: "default" | "sm";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function Button({
  children,
  variant = "ghost",
  size = "default",
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const cls = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={cls} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
}
