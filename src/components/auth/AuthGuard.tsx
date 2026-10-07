// ─────────────────────────────────────────────────────────────
//  KitsuyStore — AuthGuard
//  Protege toda a aplicação — redireciona para login se não
//  houver sessão ativa.
// ─────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import type { AuthState } from "../../hooks/useAuth";
import { LoginPage } from "./LoginPage";
import { Button } from "../ui/Button";

interface AuthGuardProps {
  auth: AuthState;
  children: ReactNode;
}

export function AuthGuard({ auth, children }: AuthGuardProps) {
  // Enquanto verifica a sessão inicial, mostra tela em branco (evita flash)
  if (auth.loading || (auth.user && auth.isStaff === null)) {
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

  // Logado, mas fora da lista da equipe → sem acesso
  if (!auth.isStaff) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 16,
        textAlign: "center",
        background: "var(--pink-pale)",
        color: "var(--text)",
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--pink)" }}>
          🔒 Acesso não autorizado
        </div>
        <p style={{ maxWidth: 380, color: "var(--text-muted)", fontSize: "0.9rem" }}>
          A conta <strong>{auth.user.email}</strong> não tem permissão para acessar o sistema.
          Peça para um administrador liberar o seu acesso.
        </p>
        <Button variant="ghost" onClick={auth.signOut}>Sair</Button>
      </div>
    );
  }

  // Logado → renderiza o app normalmente
  return <>{children}</>;
}
