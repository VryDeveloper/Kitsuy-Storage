// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Header Component
// ─────────────────────────────────────────────────────────────

import "./Header.css";

type Tab = "dashboard" | "orders" | "clients";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  orderCount: number;
  clientCount: number;
}

const TABS: { id: Tab; emoji: string; label: (o: number, c: number) => string }[] = [
  { id: "dashboard", emoji: "🏠", label: ()    => "Dashboard" },
  { id: "orders",    emoji: "📦", label: (o)   => `Pedidos${o ? ` (${o})` : ""}` },
  { id: "clients",   emoji: "👤", label: (_,c) => `Clientes${c ? ` (${c})` : ""}` },
];

export function Header({ activeTab, onTabChange, orderCount, clientCount }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-logo">
        ✦ Kitsuys<em>tore</em>
      </div>
      <nav className="header-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`header-tab${activeTab === t.id ? " active" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.emoji} {t.label(orderCount, clientCount)}
          </button>
        ))}
      </nav>
    </header>
  );
}
