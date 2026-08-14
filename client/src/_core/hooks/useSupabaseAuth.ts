import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthState = { user: User | null; session: Session | null; loading: boolean; error: Error | null };

export function useSupabaseAuth(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (active) setState({ user: data.session?.user ?? null, session: data.session ?? null, loading: false, error: error ?? null });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ user: session?.user ?? null, session: session ?? null, loading: false, error: null });
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  return {
    ...state,
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  };
}
