import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.RATE_LIMIT_BENCHMARK_URL;
const serviceRoleKey = process.env.RATE_LIMIT_BENCHMARK_SERVICE_ROLE_KEY;
const limiterSecret = process.env.RATE_LIMIT_BENCHMARK_SIGNING_SECRET;

if (process.env.NODE_ENV === "production" || process.env.VERCEL ||
    process.env.RATE_LIMIT_BENCHMARK_DISPOSABLE !== "true" || !url || !serviceRoleKey ||
    !limiterSecret || limiterSecret.trim().length < 32) throw new Error("Explicit disposable local benchmark configuration is required.");
const target = new URL(url);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || target.username || target.password) {
  throw new Error("The rate-limit benchmark is restricted to a local disposable database.");
}
// Isolate every value used by the limiter from ambient application credentials.
process.env.SUPABASE_URL = url;
process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
process.env.JWT_SECRET = limiterSecret;
const { createAiRateLimiter } = await import("../server/rate-limit.ts");

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});
const runId = `benchmark-${Date.now()}`;
const hash = (value) => createHmac("sha256", limiterSecret).update(value).digest("hex");
const counterHashes = Array.from({ length: 16 }, (_, index) => hash(`rate-limit-benchmark:${runId}:counter:${index}`));
const limiterUsers = Array.from({ length: 16 }, (_, index) => `rate-limit-benchmark:${runId}:user:${index}`);
const leaseHashes = limiterUsers.map(userId => hash(`rate-limit-lease:v1:mentor:${userId}:benchmark`));
const identityHashes = limiterUsers.map(userId => hash(`rate-limit:v1:mentor:${userId}`));

function summarize(label, samples) {
  const ordered = [...samples].sort((left, right) => left - right);
  const percentile = fraction => ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * fraction) - 1)];
  return {
    label,
    samples: samples.length,
    medianMs: Number(percentile(0.5).toFixed(2)),
    p95Ms: Number(percentile(0.95).toFixed(2)),
  };
}

async function measure(label, iterations, operation) {
  const samples = [];
  for (let index = 0; index < iterations; index += 1) {
    const startedAt = performance.now();
    await operation(index);
    samples.push(performance.now() - startedAt);
  }
  return summarize(label, samples);
}

try {
  const limiter = createAiRateLimiter();
  const results = [];
  results.push(await measure("normal unprotected-operation control", 12, async () => ({ ok: true })));
  results.push(await measure("cached-result return control", 12, async () => ({ cacheStatus: "cached" })));
  results.push(await measure("shared counter RPC", 12, async index => {
    const { error } = await supabase.rpc("consume_pathpilot_rate_limit", {
      p_key_hash: counterHashes[index],
      p_action: "mentor:burst",
      p_window_seconds: 120,
      p_max_requests: 8,
    });
    if (error) throw error;
  }));
  results.push(await measure("complete protected AI limiter path without model", 12, async index => {
    await limiter.run({
      userId: limiterUsers[index],
      action: "mentor",
      fingerprint: "benchmark",
    }, async () => ({ ok: true }));
  }));
  console.log(JSON.stringify({ run: "synthetic-only", results }, null, 2));
} finally {
  const [windowCleanup, leaseCleanup] = await Promise.all([
    supabase.from("pathpilot_rate_limit_windows").delete().in("key_hash", [...counterHashes, ...identityHashes]),
    supabase.from("pathpilot_rate_limit_leases").delete().in("lease_hash", leaseHashes),
  ]);
  if (windowCleanup.error || leaseCleanup.error) throw new Error("Rate-limit benchmark cleanup did not complete.");
}
