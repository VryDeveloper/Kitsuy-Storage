// ─────────────────────────────────────────────────────────────
//  KitsuyStore — Auth Service
// ─────────────────────────────────────────────────────────────

import { supabase } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

export type { User, Session };

export const AuthService = {
  /** Login com e-mail e senha */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  },

  /** Logout */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /** Sessão atual (retorna null se não estiver logado) */
  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /** Usuário atual */
  async getUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  /** Escuta mudanças de sessão (login / logout / expiração) */
  onAuthStateChange(callback: (user: User | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => callback(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  },

  /** Traduz erros do Supabase para português */
  translateError(message: string): string {
    if (message.includes("Invalid login credentials"))
      return "E-mail ou senha incorretos.";
    if (message.includes("Email not confirmed"))
      return "Confirme seu e-mail antes de entrar.";
    if (message.includes("Too many requests") || message.includes("rate limit"))
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    if (message.includes("User not found"))
      return "Usuário não encontrado.";
    if (message.includes("over_email_send_rate_limit"))
      return "Muitos e-mails enviados. Aguarde alguns minutos.";
    return "Erro ao fazer login. Tente novamente.";
  },
};
