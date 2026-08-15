// ─────────────────────────────────────────────────────────────
//  KitsuyStore — AuthGuard
//  Protege toda a aplicação — redireciona para login se não
//  houver sessão ativa.
// ─────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import type { AuthState } from "../../hooks/useAuth";
import { LoginPage } from "./LoginPage";

interface AuthGuardProps {
  auth: AuthState;
  children: ReactNode;
}

export function AuthGuard({ auth, children }: AuthGuardProps) {
  // Enquanto verifica a sessão inicial, mostra tela em branco (evita flash)
  if (auth.loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--pink-pale)",
        fontFamily: "var(--font-display)",
        fontSize: "1.5rem",
        color: "var(--pink)",
      }}>
        ✦ Carregando...
      </div>
    );
  }

  // Não logado → tela de login
  if (!auth.user) {
    return <LoginPage onSuccess={() => {}} />;
  }

  // Logado → renderiza o app normalmente
  return <>{children}</>;
}
