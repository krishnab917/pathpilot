import { AsyncLocalStorage } from "node:async_hooks";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const requestClientStore = new AsyncLocalStorage<SupabaseClient>();

function configuredValue(name: string) {
  return process.env[name] ?? process.env[`VITE_${name.replace("SUPABASE_", "SUPABASE_")}`];
}

export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured for this environment.");
  return { url, key };
}

export function createRequestSupabase(accessToken: string) {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export function runWithSupabaseClient<T>(client: SupabaseClient, callback: () => T) {
  return requestClientStore.run(client, callback);
}

export function currentSupabaseClient() {
  const client = requestClientStore.getStore();
  if (!client) throw new Error("A user-scoped Supabase client is required for this operation.");
  return client;
}
