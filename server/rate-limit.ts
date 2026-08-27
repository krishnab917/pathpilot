import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase";

export type AiRateLimitAction =
  | "mentor"
  | "project_guidance"
  | "roadmap_generation"
  | "profile_analysis";

type RateLimitWindow = {
  name: "burst" | "daily";
  maxRequests: number;
  windowSeconds: number;
};

export const AI_RATE_LIMIT_POLICIES: Record<AiRateLimitAction, readonly RateLimitWindow[]> = {
  mentor: [
    { name: "burst", maxRequests: 8, windowSeconds: 120 },
    { name: "daily", maxRequests: 60, windowSeconds: 86_400 },
  ],
  project_guidance: [
    { name: "burst", maxRequests: 5, windowSeconds: 300 },
    { name: "daily", maxRequests: 25, windowSeconds: 86_400 },
  ],
  roadmap_generation: [
    { name: "burst", maxRequests: 2, windowSeconds: 1_800 },
    { name: "daily", maxRequests: 6, windowSeconds: 86_400 },
  ],
  profile_analysis: [
    { name: "burst", maxRequests: 2, windowSeconds: 1_800 },
    { name: "daily", maxRequests: 4, windowSeconds: 86_400 },
  ],
};

export type RateLimitStore = {
  consume(input: { keyHash: string; action: string; windowSeconds: number; maxRequests: number }): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
  acquireLease(input: { leaseHash: string; ttlSeconds: number }): Promise<{ acquired: boolean; retryAfterSeconds: number }>;
  releaseLease(input: { leaseHash: string }): Promise<void>;
};

export class RateLimitExceededError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super(`You're sending AI requests too quickly. Please try again in about ${Math.max(1, Math.ceil(retryAfterSeconds))} seconds.`);
    this.name = "RateLimitExceededError";
  }
}

export class RateLimiterUnavailableError extends Error {
  constructor() {
    super("AI request protection is temporarily unavailable. Please try again shortly.");
    this.name = "RateLimiterUnavailableError";
  }
}

function limiterSecret() {
  return process.env.JWT_SECRET ?? "pathpilot-local-rate-limit-secret";
}

function hmac(value: string) {
  return createHmac("sha256", limiterSecret()).update(value).digest("hex");
}

function createSupabaseRateLimitStore(): RateLimitStore {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return {
      consume: async () => { throw new RateLimiterUnavailableError(); },
      acquireLease: async () => { throw new RateLimiterUnavailableError(); },
      releaseLease: async () => undefined,
    };
  }

  const client = createClient(getSupabaseConfig().url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return {
    async consume(input) {
      const { data, error } = await client.rpc("consume_pathpilot_rate_limit", {
        p_key_hash: input.keyHash,
        p_action: input.action,
        p_window_seconds: input.windowSeconds,
        p_max_requests: input.maxRequests,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row || typeof row.allowed !== "boolean" || typeof row.retry_after_seconds !== "number") throw new RateLimiterUnavailableError();
      return { allowed: row.allowed, retryAfterSeconds: row.retry_after_seconds };
    },
    async acquireLease(input) {
      const { data, error } = await client.rpc("acquire_pathpilot_rate_limit_lease", {
        p_lease_hash: input.leaseHash,
        p_ttl_seconds: input.ttlSeconds,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row || typeof row.acquired !== "boolean" || typeof row.retry_after_seconds !== "number") throw new RateLimiterUnavailableError();
      return { acquired: row.acquired, retryAfterSeconds: row.retry_after_seconds };
    },
    async releaseLease(input) {
      const { error } = await client.rpc("release_pathpilot_rate_limit_lease", { p_lease_hash: input.leaseHash });
      if (error) console.warn("[PathPilot] rate-limit lease release failed");
    },
  };
}

function createPermissiveTestStore(): RateLimitStore {
  return {
    consume: async () => ({ allowed: true, retryAfterSeconds: 0 }),
    acquireLease: async () => ({ acquired: true, retryAfterSeconds: 0 }),
    releaseLease: async () => undefined,
  };
}

export function createAiRateLimiter(store: RateLimitStore = process.env.VITEST ? createPermissiveTestStore() : createSupabaseRateLimitStore()) {
  return {
    async run<T>(input: { userId: string; action: AiRateLimitAction; fingerprint: string }, operation: () => Promise<T>) {
      const policy = AI_RATE_LIMIT_POLICIES[input.action];
      const identityHash = hmac(`rate-limit:v1:${input.action}:${input.userId}`);
      const leaseHash = hmac(`rate-limit-lease:v1:${input.action}:${input.userId}:${input.fingerprint}`);
      let leaseHeld = false;
      try {
        const lease = await store.acquireLease({ leaseHash, ttlSeconds: 180 });
        if (!lease.acquired) {
          console.info("[PathPilot] duplicate AI request rejected", { action: input.action });
          throw new RateLimitExceededError(lease.retryAfterSeconds);
        }
        leaseHeld = true;
        for (const window of policy) {
          const result = await store.consume({
            keyHash: identityHash,
            action: `${input.action}:${window.name}`,
            windowSeconds: window.windowSeconds,
            maxRequests: window.maxRequests,
          });
          if (!result.allowed) {
            console.info("[PathPilot] AI rate limit exceeded", { action: input.action, window: window.name });
            throw new RateLimitExceededError(result.retryAfterSeconds);
          }
        }
        return await operation();
      } catch (error) {
        if (error instanceof RateLimitExceededError || error instanceof RateLimiterUnavailableError) throw error;
        throw error;
      } finally {
        if (leaseHeld) await store.releaseLease({ leaseHash });
      }
    },
  };
}

export const aiRateLimiter = createAiRateLimiter();
