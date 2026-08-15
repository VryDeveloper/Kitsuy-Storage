// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Formatters & Helpers
// ─────────────────────────────────────────────────────────────

export const genId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const today = (): string => new Date().toISOString().slice(0, 10);

export const fmt = (value: number | string | undefined): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);

export const fmtDate = (dateStr: string): string => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
};
