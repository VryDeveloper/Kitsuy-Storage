// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Header Component
// ─────────────────────────────────────────────────────────────

import type { User } from "../../services/auth";
import "./Header.css";

type Tab = "dashboard" | "orders" | "clients";

interface HeaderProps {
  activeTab:    Tab;
  onTabChange:  (tab: Tab) => void;
  orderCount:   number;
  clientCount:  number;
  user:         User;
  onSignOut:    () => void;
}

const TABS: { id: Tab; emoji: string; label: (o: number, c: number) => string }[] = [
  { id: "dashboard", emoji: "🏠", label: ()    => "Dashboard" },
  { id: "orders",    emoji: "📦", label: (o)   => `Pedidos${o ? ` (${o})` : ""}` },
  { id: "clients",   emoji: "👤", label: (_,c) => `Clientes${c ? ` (${c})` : ""}` },
];

export function Header({ activeTab, onTabChange, orderCount, clientCount, user, onSignOut }: HeaderProps) {
  const email = user.email ? user.email : "Usuário";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <header className="header">
      <div className="header-logo">
        ✦ Kitsuy<em>storage</em>
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
      <div className="header-user">
        <div className="header-avatar" title={email}>{initials}</div>
        <span className="header-email">{email}</span>
        <button className="header-signout" onClick={onSignOut} title="Sair">
          Sair
        </button>
      </div>
    </header>
  );
}
