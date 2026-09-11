import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const missingSupabaseBrowserConfig = [
  !url && "VITE_SUPABASE_URL",
  !anonKey && "VITE_SUPABASE_ANON_KEY",
].filter((variable): variable is string => Boolean(variable));

export const isSupabaseBrowserConfigured =
  missingSupabaseBrowserConfig.length === 0;

// Do not throw during module loading: main.tsx renders a setup screen when the
// public build-time values are absent. The placeholder is never used in that
// state and cannot target a real Supabase project.
export const supabase = createClient(
  url || "https://pathpilot-unconfigured.invalid",
  anonKey || "pathpilot-unconfigured",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

let accessToken: string | null = null;

export async function hydrateSupabaseSession() {
  const { data } = await supabase.auth.getSession();
  accessToken = data.session?.access_token ?? null;
  return data.session;
}

if (isSupabaseBrowserConfigured) {
  supabase.auth.onAuthStateChange((_event, session) => {
    accessToken = session?.access_token ?? null;
  });
}

export function getSupabaseAccessToken() {
  return accessToken;
}
