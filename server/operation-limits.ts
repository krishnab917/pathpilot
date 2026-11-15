import { createSupabaseRateLimitStore, protectionHash, RateLimitExceededError, RateLimiterUnavailableError, type RateLimitStore } from "./rate-limit";
import { isIsolatedTest } from "./security-config";

// Fixed-window admission limits, not a dollar/token-spend guarantee. Global
// provider attempts include model listing, validation retries and HTTP retries.
export const SHARED_QUOTAS = {
  "api:read": { maxRequests: 600, windowSeconds: 120 },
  "api:write": { maxRequests: 100, windowSeconds: 120 },
  "api:sensitive": { maxRequests: 3, windowSeconds: 1800 },
  "worker:burst": { maxRequests: 60, windowSeconds: 120 },
  "ai_global:burst": { maxRequests: 100, windowSeconds: 120 },
  "ai_global:daily": { maxRequests: 2000, windowSeconds: 86400 },
} as const;
type SharedAction = keyof typeof SHARED_QUOTAS;
export function createOperationLimiter(store?: RateLimitStore) {
  return {
    async consume(identity: string, action: SharedAction, maximum?: number, windowSeconds?: number) {
      // Explicitly isolated unit tests inject a store to exercise enforcement.
      if (!store && isIsolatedTest()) return;
      const keyHash = protectionHash(`shared-quota:v1:${identity}:${action}`);
      const policy = SHARED_QUOTAS[action];
      try {
        const result = await (store ?? createSupabaseRateLimitStore()).consume({ keyHash, action, maxRequests: maximum ?? policy.maxRequests, windowSeconds: windowSeconds ?? policy.windowSeconds });
        if (!result.allowed) throw new RateLimitExceededError(result.retryAfterSeconds);
      } catch (error) {
        if (error instanceof RateLimitExceededError) throw error;
        throw new RateLimiterUnavailableError();
      }
    },
  };
}
export const operationLimiter = createOperationLimiter();
export async function protectProviderAttempt() {
  await operationLimiter.consume("application", "ai_global:burst");
  await operationLimiter.consume("application", "ai_global:daily");
}
