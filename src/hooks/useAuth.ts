import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import type { User } from "@supabase/supabase-js";

export interface AuthState {
  user:    User | null;
  loading: boolean;
  signIn:  (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  return { user, loading, signIn, signOut };
}