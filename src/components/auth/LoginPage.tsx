// ─────────────────────────────────────────────────────────────
//  KitsuyStore — LoginPage
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { AuthService } from "../../services/auth";
import "./LoginPage.css";

const MAX_ATTEMPTS   = 5;    // tentativas antes de bloquear
const LOCKOUT_SECS   = 120;  // 2 minutos de bloqueio

interface LoginPageProps {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [attempts,    setAttempts]    = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remaining,   setRemaining]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persiste estado de bloqueio no sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("ks-locked-until");
    const storedAttempts = sessionStorage.getItem("ks-attempts");
    if (stored) {
      const until = parseInt(stored, 10);
      if (until > Date.now()) {
        setLockedUntil(until);
      } else {
        sessionStorage.removeItem("ks-locked-until");
        sessionStorage.removeItem("ks-attempts");
      }
    }
    if (storedAttempts) setAttempts(parseInt(storedAttempts, 10));
  }, []);

  // Countdown do bloqueio
  useEffect(() => {
    if (!lockedUntil) { setRemaining(0); return; }

    const tick = () => {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (secs <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setError("");
        sessionStorage.removeItem("ks-locked-until");
        sessionStorage.removeItem("ks-attempts");
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setRemaining(secs);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lockedUntil]);

  const isLocked = !!lockedUntil && lockedUntil > Date.now();

  const handleSubmit = async () => {
    if (isLocked || loading) return;
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await AuthService.signIn(email, password);
      // Limpa tentativas ao logar com sucesso
      setAttempts(0);
      sessionStorage.removeItem("ks-attempts");
      sessionStorage.removeItem("ks-locked-until");
      onSuccess();
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      sessionStorage.setItem("ks-attempts", String(newAttempts));

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECS * 1000;
        setLockedUntil(until);
        sessionStorage.setItem("ks-locked-until", String(until));
        setError("");
      } else {
        setError(AuthService.translateError(err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
  };

  return (
    <div className="login-bg">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-text">✦ KitsuyStore</div>
        </div>
        <div className="login-subtitle">Sistema de gerenciamento de pedidos</div>

        <div className="login-form">

          {/* E-mail */}
          <div className="login-field">
            <label>E-mail</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">📧</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKey}
                placeholder="seu@email.com"
                disabled={isLocked || loading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="login-field">
            <label>Senha</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">🔒</span>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                placeholder="••••••••"
                disabled={isLocked || loading}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Erro de credenciais */}
          {error && !isLocked && (
            <div className="login-error">
              <span className="login-error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Bloqueio temporário */}
          {isLocked && (
            <div className="login-locked">
              <div>
                <div>🔐 Acesso bloqueado por segurança.</div>
                <div style={{ marginTop: 4, fontSize: "0.78rem", fontWeight: 500 }}>
                  Muitas tentativas incorretas. Aguarde para tentar novamente.
                </div>
                <div className="login-locked-timer">{fmtTime(remaining)}</div>
              </div>
            </div>
          )}

          {/* Indicador de tentativas */}
          {attempts > 0 && !isLocked && (
            <div className="login-attempts">
              <span>{attempts}</span> de {MAX_ATTEMPTS} tentativas usadas
            </div>
          )}

          {/* Botão */}
          <button
            className="login-btn"
            onClick={handleSubmit}
            disabled={isLocked || loading}
          >
            {loading ? "Entrando..." : isLocked ? `🔐 Bloqueado (${fmtTime(remaining)})` : "Entrar"}
          </button>
        </div>

        <div className="login-footer">
          Acesso restrito · KitsuyStore &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
