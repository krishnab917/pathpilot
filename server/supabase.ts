import { AsyncLocalStorage } from "node:async_hooks";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const requestClientStore = new AsyncLocalStorage<SupabaseClient>();

function configuredValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export function getSupabaseConfig() {
  const url = configuredValue(
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "VITE_SUPABASE_URL"
  );
  const key = configuredValue(
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY"
  );
  if (!url || !key)
    throw new Error("Supabase is not configured for this environment.");
  return { url, key };
}

export function getOptionalSupabaseServiceRoleKey() {
  return configuredValue("SUPABASE_SERVICE_ROLE_KEY") || null;
}

export function getSupabaseServiceRoleKey(featureName: string) {
  const key = getOptionalSupabaseServiceRoleKey();
  if (!key) throw new Error(`${featureName} is not configured.`);
  return key;
}

export function createRequestSupabase(accessToken: string) {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export function createPublicSupabase() {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export function runWithSupabaseClient<T>(
  client: SupabaseClient,
  callback: () => T
) {
  return requestClientStore.run(client, callback);
}

export function currentSupabaseClient() {
  const client = requestClientStore.getStore();
  if (!client)
    throw new Error(
      "A user-scoped Supabase client is required for this operation."
    );
  return client;
}
