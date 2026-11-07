import { afterEach, describe, expect, it, vi } from "vitest";
import { createOperationLimiter, operationLimiter } from "../server/operation-limits";
import { createAiRateLimiter, createSupabaseRateLimitStore, RateLimitExceededError, RateLimiterUnavailableError, type RateLimitStore } from "../server/rate-limit";
import { requestProviderJson } from "../server/ai/provider-request";
import { runLimitedAiRequest } from "../server/routers/pathpilot";

function atomicStore(): RateLimitStore {
  const counters = new Map<string, number>(), leases = new Set<string>();
  return {
    async consume(input) {
      const key = `${input.keyHash}:${input.action}`;
      const count = (counters.get(key) ?? 0) + 1; counters.set(key, count);
      return { allowed: count <= input.maxRequests, retryAfterSeconds: 12 };
    },
    async acquireLease({ leaseHash }) { const acquired = !leases.has(leaseHash); leases.add(leaseHash); return { acquired, retryAfterSeconds: 12 }; },
    async releaseLease({ leaseHash }) { leases.delete(leaseHash); },
  };
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
describe("distributed admission contracts (shared offline store)", () => {
  it.each(["normal", "denied", "malformed", "network"])("uses bounded service-only RPC and handles %s backend response safely", async scenario => {
    vi.stubEnv("SUPABASE_URL", "https://quota.invalid"); vi.stubEnv("SUPABASE_ANON_KEY", "offline-public-fixture"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "offline-service-fixture");
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      expect(new URL(String(url)).pathname).toBe("/rest/v1/rpc/consume_pathpilot_rate_limit");
      expect(new Headers(init.headers).get("authorization")).toBe("Bearer offline-service-fixture");
      expect(init.signal).toBeInstanceOf(AbortSignal);
      const body = JSON.parse(String(init.body)); expect(body.p_action).toBe("ai_global:burst");
      if (scenario === "network") throw new Error("PRIVATE_NETWORK_SENTINEL");
      if (scenario === "denied") return Response.json({ message: "PRIVATE_BACKEND_SENTINEL" }, { status: 403 });
      return Response.json([{ allowed: true, retry_after_seconds: scenario === "malformed" ? -1 : 0 }]);
    }));
    const result = createSupabaseRateLimitStore().consume({ keyHash: "a".repeat(64), action: "ai_global:burst", windowSeconds: 120, maxRequests: 100 });
    if (scenario === "normal") await expect(result).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 });
    else await expect(result).rejects.toBeInstanceOf(RateLimiterUnavailableError);
  });
  it("shares atomic global budgets across independent limiter instances", async () => {
    const store = atomicStore(), a = createOperationLimiter(store), b = createOperationLimiter(store);
    const results = await Promise.allSettled(Array.from({ length: 8 }, (_, index) => (index % 2 ? a : b).consume("application", "ai_global:burst", 3)));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(3);
    expect(results.filter(result => result.status === "rejected").every(result => result.reason instanceof RateLimitExceededError)).toBe(true);
  });
  it("fails closed on backend errors without exposing backend details", async () => {
    const store = atomicStore(); store.consume = async () => { throw new Error("PRIVATE_BACKEND_SENTINEL"); };
    await expect(createOperationLimiter(store).consume("application", "ai_global:daily")).rejects.toBeInstanceOf(RateLimiterUnavailableError);
  });
  it("enforces the daily ceiling independently of the burst allowance", async () => {
    const limiter = createOperationLimiter(atomicStore());
    await limiter.consume("application", "ai_global:daily", 1);
    await expect(limiter.consume("application", "ai_global:daily", 1)).rejects.toBeInstanceOf(RateLimitExceededError);
    await expect(limiter.consume("application", "ai_global:burst", 1)).resolves.toBeUndefined();
  });
  it("retains shared duplicate leases across limiter instances and permits a completed retry", async () => {
    const store = atomicStore(), a = createAiRateLimiter(store), b = createAiRateLimiter(store);
    let complete!: () => void;
    const pending = new Promise<void>(resolve => { complete = resolve; });
    const first = a.run({ userId: "example-owner", action: "mentor", fingerprint: "same" }, () => pending);
    await Promise.resolve();
    await expect(b.run({ userId: "example-owner", action: "mentor", fingerprint: "same" }, async () => true)).rejects.toBeInstanceOf(RateLimitExceededError);
    complete(); await first;
    await expect(b.run({ userId: "example-owner", action: "mentor", fingerprint: "same" }, async () => true)).resolves.toBe(true);
  });
  it("charges every HTTP retry and stops before fetching when global budget is exhausted", async () => {
    vi.useFakeTimers();
    const limiter = createOperationLimiter(atomicStore());
    const consume = vi.spyOn(operationLimiter, "consume").mockImplementation((identity, action) => limiter.consume(identity, action, action === "ai_global:burst" ? 1 : 2000));
    const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 503 })); vi.stubGlobal("fetch", fetcher);
    const result = expect(requestProviderJson("https://provider.invalid", {})).rejects.toBeInstanceOf(RateLimitExceededError);
    await vi.runAllTimersAsync(); await result;
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(consume.mock.calls.map(call => call[1])).toEqual(["ai_global:burst", "ai_global:daily", "ai_global:burst"]);
  });
  it("does not invoke the provider with an unavailable quota backend", async () => {
    vi.spyOn(operationLimiter, "consume").mockRejectedValue(new RateLimiterUnavailableError());
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(requestProviderJson("https://provider.invalid", {})).rejects.toBeInstanceOf(RateLimiterUnavailableError);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["exhausted", "unavailable"])("surfaces sanitized tRPC protection status for %s provider budgets", async kind => {
    vi.spyOn(operationLimiter, "consume").mockRejectedValue(kind === "exhausted" ? new RateLimitExceededError(12) : new RateLimiterUnavailableError());
    const headers = vi.fn();
    await expect(runLimitedAiRequest({ user: { id: "example-owner" }, res: { setHeader: headers } }, "mentor", "fictional-question", () => requestProviderJson("https://provider.invalid", {})))
      .rejects.toMatchObject({ code: kind === "exhausted" ? "TOO_MANY_REQUESTS" : "SERVICE_UNAVAILABLE" });
    if (kind === "exhausted") expect(headers).toHaveBeenCalledWith("Retry-After", "12");
  });
  it("permits legitimate provider requests and charges both global windows", async () => {
    const limiter = createOperationLimiter(atomicStore());
    const consume = vi.spyOn(operationLimiter, "consume").mockImplementation((...args) => limiter.consume(...args));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: true })));
    await expect(requestProviderJson("https://provider.invalid", {})).resolves.toEqual({ ok: true });
    expect(consume).toHaveBeenCalledTimes(2);
  });
});
