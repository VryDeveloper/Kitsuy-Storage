import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import type { User } from "@supabase/supabase-js";

export interface AuthState {
  user:    User | null;
  loading: boolean;
  isStaff: boolean | null;   // null = verificando

  signIn:  (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  useEffect(() => {
    // 1) onAuthStateChange → resolve o loading imediatamente (sem async)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // 2) getUser() separado → atualiza o user_metadata sem bloquear nada
    //    Roda em paralelo, não afeta o loading
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Confere se a conta está na lista da equipe (app_staff).
  // É só para a interface — quem bloqueia de verdade são as políticas do banco,
  // por isso, se a verificação falhar (ex.: script ainda não rodado), não trava o app.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) { setIsStaff(null); return; }
    let cancelled = false;
    setIsStaff(null);
    supabase.rpc("is_staff").then(({ data, error }) => {
      if (!cancelled) setIsStaff(error ? true : data === true);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, isStaff, signIn, signOut };
}