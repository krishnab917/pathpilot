export const liveSupabaseFiles = [
  "tests/supabase-config.test.ts", "tests/supabase-service-role.test.ts", "tests/supabase-rls.test.ts",
];

export function assertDisposableSupabase(env: NodeJS.ProcessEnv = process.env) {
  if (env.RUN_SUPABASE_INTEGRATION !== "1" || env.SUPABASE_TEST_DISPOSABLE !== "1" || env.NODE_ENV === "production" || env.VERCEL) {
    throw new Error("Live Supabase tests require explicit disposable-environment opt-in.");
  }
  const values = [env.SUPABASE_URL, env.VITE_SUPABASE_URL].filter((value): value is string => Boolean(value));
  if (!values.length) throw new Error("A disposable Supabase test origin is required.");
  const origins = values.map(value => new URL(value));
  if (new Set(origins.map(url => url.origin)).size !== 1) throw new Error("Supabase test origins must match.");
  for (const url of origins) {
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const disposableProject = env.SUPABASE_TEST_PROJECT_REF && url.hostname === `${env.SUPABASE_TEST_PROJECT_REF}.supabase.co` && url.protocol === "https:";
    if ((!local && !disposableProject) || url.username || url.password) throw new Error("Supabase tests must target the explicitly designated disposable project.");
  }
}
