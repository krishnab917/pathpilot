import { createHash, randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOperationLimiter, operationLimiter } from "../server/operation-limits";
import { RateLimiterUnavailableError, type RateLimitStore } from "../server/rate-limit";
import { processNextDerivedAnalysis } from "../server/derived-analysis";
import { handleDerivedAnalysisWorker } from "../server/derived-analysis-handler";

let token: string, rpc: ReturnType<typeof vi.fn>, lookup: ReturnType<typeof vi.fn>;
beforeEach(() => {
  token = randomBytes(32).toString("hex");
  vi.stubEnv("SUPABASE_URL", "https://worker.invalid"); vi.stubEnv("SUPABASE_ANON_KEY", "offline-public-fixture"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "offline-service-fixture");
  rpc = vi.fn(async () => Response.json({ authorized: true, processed: false, reason: "empty" }));
  lookup = vi.fn(async () => Response.json({ token_hash: createHash("sha256").update(token).digest("hex") }));
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer offline-service-fixture");
    expect(String(url)).not.toContain(token);
    if (new URL(String(url)).pathname.endsWith("/background_worker_credentials")) { expect(init.signal).toBeInstanceOf(AbortSignal); return lookup(); }
    expect(new URL(String(url)).pathname).toBe("/rest/v1/rpc/process_next_derived_analysis");
    expect(JSON.parse(String(init.body))).toEqual({ worker_token: token });
    return rpc();
  }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function admission() {
  let count = 0;
  const store: RateLimitStore = {
    async consume(input) { count++; return { allowed: count <= input.maxRequests, retryAfterSeconds: 9 }; },
    async acquireLease() { throw new Error("not used"); }, async releaseLease() {},
  };
  const a = createOperationLimiter(store), b = createOperationLimiter(store); let instance = 0;
  return vi.spyOn(operationLimiter, "consume").mockImplementation((...args) => (++instance % 2 ? a : b).consume(...args));
}
const response = () => { const res: any = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() }; res.status.mockReturnValue(res); return res; };
describe("worker-only admission after token authorization", () => {
  it("preserves a legitimate worker result and uses one stable application budget", async () => {
    const consume = admission();
    await expect(processNextDerivedAnalysis(token)).resolves.toMatchObject({ authorized: true, reason: "empty" });
    expect(consume).toHaveBeenCalledWith("worker:derived-analysis", "worker:burst"); expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("does not spend scheduler capacity for malformed or incorrect tokens", async () => {
    const consume = admission();
    await expect(processNextDerivedAnalysis("invalid")).resolves.toEqual({ authorized: false });
    expect(lookup).not.toHaveBeenCalled();
    await expect(processNextDerivedAnalysis(randomBytes(32).toString("hex"))).resolves.toEqual({ authorized: false });
    expect(consume).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
  });
  it("bounds concurrent worker calls and repeated retries through shared admission objects", async () => {
    admission();
    const results = await Promise.allSettled(Array.from({ length: 61 }, () => processNextDerivedAnalysis(token)));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(60);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
    expect(rpc).toHaveBeenCalledTimes(60);
    const res = response(); await handleDerivedAnalysisWorker({ body: { token } } as any, res);
    expect(res.status).toHaveBeenCalledWith(429); expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "9"); expect(rpc).toHaveBeenCalledTimes(60);
  });
  it("returns safe 503 on quota outage without processing a job", async () => {
    vi.spyOn(operationLimiter, "consume").mockRejectedValue(new RateLimiterUnavailableError());
    const res = response(); await handleDerivedAnalysisWorker({ body: { token } } as any, res);
    expect(res.status).toHaveBeenCalledWith(503); expect(JSON.stringify(res.json.mock.calls)).not.toContain(token); expect(rpc).not.toHaveBeenCalled();
  });
  it("fails closed with the existing generic worker error on unavailable credential verification", async () => {
    const consume = admission(); lookup.mockResolvedValue(Response.json({ message: "PRIVATE_LOOKUP_SENTINEL" }, { status: 403 }));
    const res = response(); await handleDerivedAnalysisWorker({ body: { token } } as any, res);
    expect(res.status).toHaveBeenCalledWith(500); expect(JSON.stringify(res.json.mock.calls)).not.toContain("PRIVATE_LOOKUP_SENTINEL"); expect(consume).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
  });
  it("retains RPC authorization after preflight, including a rotated verifier", async () => {
    admission(); rpc.mockResolvedValue(Response.json({ authorized: false }));
    const res = response(); await handleDerivedAnalysisWorker({ body: { token } } as any, res);
    expect(res.status).toHaveBeenCalledWith(403); expect(rpc).toHaveBeenCalledTimes(1);
  });
});
