import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("PathPilot is missing its public Supabase configuration.");
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

let accessToken: string | null = null;

export async function hydrateSupabaseSession() {
  const { data } = await supabase.auth.getSession();
  accessToken = data.session?.access_token ?? null;
  return data.session;
}

supabase.auth.onAuthStateChange((_event, session) => {
  accessToken = session?.access_token ?? null;
});

export function getSupabaseAccessToken() {
  return accessToken;
}
