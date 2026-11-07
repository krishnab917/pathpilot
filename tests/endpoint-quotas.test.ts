import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";
import { createOperationLimiter, operationLimiter } from "../server/operation-limits";
import { RateLimiterUnavailableError, type RateLimitStore } from "../server/rate-limit";
import { admitDerivedSubmission } from "../server/endpoint-quotas";

const db = vi.hoisted(() => ({ refreshNasaSpaceAppsOpportunity: vi.fn(), refreshCuratedOpportunityCatalog: vi.fn(), searchVerifiedOpportunities: vi.fn(), getSharedPlanningReport: vi.fn(), getPublicPortfolio: vi.fn() }));
vi.mock("../server/db", async original => ({ ...await original<typeof import("../server/db")>(), ...db }));
const analysis = vi.hoisted(() => ({ requestDerivedAnalysis: vi.fn(), retryDerivedAnalysis: vi.fn(), getDerivedAnalysisStatus: vi.fn(), cancelDerivedAnalysis: vi.fn() }));
vi.mock("../server/derived-analysis", async original => ({ ...await original<typeof import("../server/derived-analysis")>(), ...analysis }));
const notifications = vi.hoisted(() => ({ notifyOwner: vi.fn() }));
vi.mock("../server/_core/notification", () => notifications);
import { appRouter } from "../server/routers";

function sharedStore(): RateLimitStore {
  const counters = new Map<string, number>();
  return {
    async consume(input) {
      const key = `${input.keyHash}:${input.action}:${input.windowSeconds}`;
      const count = (counters.get(key) ?? 0) + 1; counters.set(key, count);
      return { allowed: count <= input.maxRequests, retryAfterSeconds: 17 };
    },
    async acquireLease() { throw new Error("Not part of endpoint quota contract"); },
    async releaseLease() {},
  };
}
const context = (role: "admin" | "user" = "admin", id = "11111111-1111-4111-8111-111111111111") => ({ user: { id, email: null, name: null, role }, supabase: {}, req: {}, res: { setHeader: vi.fn() } }) as unknown as TrpcContext;
beforeEach(() => { vi.clearAllMocks(); notifications.notifyOwner.mockResolvedValue(true); db.refreshNasaSpaceAppsOpportunity.mockResolvedValue({ id: "example", title: "Fictional test result" }); db.refreshCuratedOpportunityCatalog.mockResolvedValue({ imported: 100 }); db.searchVerifiedOpportunities.mockResolvedValue({ items: [], totalCount: 0 }); analysis.requestDerivedAnalysis.mockResolvedValue({ id: "fictional-job", status: "queued" }); analysis.retryDerivedAnalysis.mockResolvedValue({ id: "fictional-job", status: "queued" }); analysis.getDerivedAnalysisStatus.mockResolvedValue({ job: null }); analysis.cancelDerivedAnalysis.mockResolvedValue({ status: "cancelled" }); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
beforeEach(() => { db.getSharedPlanningReport.mockResolvedValue({ method: "Synthetic public counts" }); db.getPublicPortfolio.mockResolvedValue(null); vi.stubEnv("SUPABASE_URL", "https://public-quota.invalid"); vi.stubEnv("SUPABASE_ANON_KEY", "offline-public-fixture"); });
function sharedAdmission() {
  // Two independent limiter objects sharing one atomic fake backend; not proof
  // of real multi-process PostgreSQL concurrency.
  const store = sharedStore(), a = createOperationLimiter(store), b = createOperationLimiter(store);
  let index = 0;
  return vi.spyOn(operationLimiter, "consume").mockImplementation((...args) => (++index % 2 ? a : b).consume(...args));
}

describe("optional NASA refresh admission", () => {
  it("preserves the result below the cap and stops subsequent retries before external work", async () => {
    const consume = sharedAdmission(), ctx = context(); const caller = appRouter.createCaller(ctx);
    await expect(caller.pathpilot.opportunities.refreshNasaSource()).resolves.toMatchObject({ id: "example" });
    await caller.pathpilot.opportunities.refreshNasaSource();
    await expect(caller.pathpilot.opportunities.refreshNasaSource()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(ctx.res.setHeader).toHaveBeenCalledWith("Retry-After", "17");
    expect(db.refreshNasaSpaceAppsOpportunity).toHaveBeenCalledTimes(2);
    expect(consume).toHaveBeenCalledWith("source-refresh:application", "api:sensitive", 2, 1800);
  });
  it("bounds concurrent callers across independent admission objects and administrator identities", async () => {
    sharedAdmission();
    const calls = [context(), context("admin", "22222222-2222-4222-8222-222222222222"), context()];
    const result = await Promise.allSettled(calls.map(ctx => appRouter.createCaller(ctx).pathpilot.opportunities.refreshNasaSource()));
    expect(result.filter(item => item.status === "fulfilled")).toHaveLength(2);
    expect(result.filter(item => item.status === "rejected")).toHaveLength(1);
    expect(db.refreshNasaSpaceAppsOpportunity).toHaveBeenCalledTimes(2);
  });
  it("fails only refresh with safe 503 while existing catalog reads remain available", async () => {
    vi.spyOn(operationLimiter, "consume").mockRejectedValue(new Error("PRIVATE_BACKEND_SENTINEL"));
    const caller = appRouter.createCaller(context());
    await expect(caller.pathpilot.opportunities.refreshNasaSource()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "Request protection is temporarily unavailable. Please try again shortly." });
    expect(db.refreshNasaSpaceAppsOpportunity).not.toHaveBeenCalled();
    await expect(caller.pathpilot.opportunities.list()).resolves.toMatchObject({ items: [] });
  });
  it("rejects ordinary and anonymous callers before touching quota configuration", async () => {
    const consume = vi.spyOn(operationLimiter, "consume").mockRejectedValue(new RateLimiterUnavailableError());
    await expect(appRouter.createCaller(context("user")).pathpilot.opportunities.refreshNasaSource()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller({ ...context(), user: null, supabase: null }).pathpilot.opportunities.refreshNasaSource()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(consume).not.toHaveBeenCalled();
  });
  it("retains the existing sanitized upstream error contract after admission", async () => {
    sharedAdmission(); db.refreshNasaSpaceAppsOpportunity.mockRejectedValue(new Error("PRIVATE_FETCH_SENTINEL"));
    await expect(appRouter.createCaller(context()).pathpilot.opportunities.refreshNasaSource()).rejects.toMatchObject({ code: "BAD_GATEWAY", message: "The official source could not be refreshed. The last verified record remains unchanged." });
  });
});

describe("optional curated refresh shares direct-source capacity", () => {
  it("preserves a normal result and prevents bypass by alternating both refresh routes", async () => {
    sharedAdmission(); const caller = appRouter.createCaller(context());
    await expect(caller.pathpilot.opportunities.refreshCuratedCatalog()).resolves.toEqual({ imported: 100 });
    await caller.pathpilot.opportunities.refreshNasaSource();
    await expect(caller.pathpilot.opportunities.refreshCuratedCatalog()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(db.refreshCuratedOpportunityCatalog).toHaveBeenCalledTimes(1);
  });
  it("bounds simultaneous direct/indirect source runs across two admission objects", async () => {
    sharedAdmission(); const a = appRouter.createCaller(context()), b = appRouter.createCaller(context("admin", "22222222-2222-4222-8222-222222222222"));
    const results = await Promise.allSettled([a.pathpilot.opportunities.refreshCuratedCatalog(), b.pathpilot.opportunities.refreshNasaSource(), b.pathpilot.opportunities.refreshCuratedCatalog()]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(2);
    expect(db.refreshCuratedOpportunityCatalog.mock.calls.length + db.refreshNasaSpaceAppsOpportunity.mock.calls.length).toBe(2);
  });
  it("rejects quota outage without external refresh while preserving read availability", async () => {
    vi.spyOn(operationLimiter, "consume").mockRejectedValue(new RateLimiterUnavailableError());
    const caller = appRouter.createCaller(context());
    await expect(caller.pathpilot.opportunities.refreshCuratedCatalog()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(db.refreshCuratedOpportunityCatalog).not.toHaveBeenCalled();
    await expect(caller.pathpilot.opportunities.list()).resolves.toMatchObject({ items: [] });
  });
  it("does not charge rejected non-administrator calls", async () => {
    const consume = sharedAdmission();
    await expect(appRouter.createCaller(context("user")).pathpilot.opportunities.refreshCuratedCatalog()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(consume).not.toHaveBeenCalled();
  });
});

describe("owner-derived submission admission", () => {
  it("permits ten requests and rejects further submissions without writing a job", async () => {
    const consume = sharedAdmission(), ctx = context("user"), caller = appRouter.createCaller(ctx);
    for (let index = 0; index < 10; index++) await expect(caller.pathpilot.derivedAnalysis.request()).resolves.toMatchObject({ status: "queued" });
    await expect(caller.pathpilot.derivedAnalysis.request()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(analysis.requestDerivedAnalysis).toHaveBeenCalledTimes(10);
    expect(consume).toHaveBeenCalledWith(`derived-submission:user:${ctx.user!.id}`, "api:sensitive", 10, 300);
  });
  it("shares admission across concurrent caller objects without consuming another student's capacity", async () => {
    sharedAdmission();
    const a = appRouter.createCaller(context("user")), b = appRouter.createCaller(context("user"));
    const results = await Promise.allSettled(Array.from({ length: 12 }, (_, index) => (index % 2 ? a : b).pathpilot.derivedAnalysis.request()));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(10);
    await expect(appRouter.createCaller(context("user", "22222222-2222-4222-8222-222222222222")).pathpilot.derivedAnalysis.request()).resolves.toMatchObject({ status: "queued" });
  });
  it("keeps status and cancellation available when new submission protection is unavailable", async () => {
    vi.spyOn(operationLimiter, "consume").mockRejectedValue(new RateLimiterUnavailableError());
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.pathpilot.derivedAnalysis.request()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(analysis.requestDerivedAnalysis).not.toHaveBeenCalled();
    await expect(caller.pathpilot.derivedAnalysis.status()).resolves.toEqual({ job: null });
    await expect(caller.pathpilot.derivedAnalysis.cancel({ id: "33333333-3333-4333-8333-333333333333" })).resolves.toMatchObject({ status: "cancelled" });
  });
  it("rejects unauthenticated or malformed identities without consuming quota", async () => {
    const consume = sharedAdmission();
    await expect(appRouter.createCaller({ ...context(), user: null, supabase: null }).pathpilot.derivedAnalysis.request()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(() => admitDerivedSubmission({}, "malformed-owner")).toThrow();
    expect(consume).not.toHaveBeenCalled();
  });
});

describe("derived retries share owner submission admission", () => {
  const job = "33333333-3333-4333-8333-333333333333";
  it("preserves normal retry results and prevents alternating requests/retries or changing job IDs from resetting quota", async () => {
    sharedAdmission(); const caller = appRouter.createCaller(context("user"));
    await expect(caller.pathpilot.derivedAnalysis.retry({ id: job })).resolves.toMatchObject({ status: "queued" });
    for (let index = 0; index < 9; index++) await caller.pathpilot.derivedAnalysis.request();
    await expect(caller.pathpilot.derivedAnalysis.retry({ id: "44444444-4444-4444-8444-444444444444" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(analysis.retryDerivedAnalysis).toHaveBeenCalledTimes(1);
  });
  it("caps concurrent mixed routes through independent admission objects", async () => {
    sharedAdmission(); const a = appRouter.createCaller(context("user")), b = appRouter.createCaller(context("user"));
    const result = await Promise.allSettled(Array.from({ length: 12 }, (_, index) => index % 2 ? a.pathpilot.derivedAnalysis.request() : b.pathpilot.derivedAnalysis.retry({ id: job })));
    expect(result.filter(item => item.status === "fulfilled")).toHaveLength(10);
    expect(analysis.requestDerivedAnalysis.mock.calls.length + analysis.retryDerivedAnalysis.mock.calls.length).toBe(10);
  });
  it("rejects malformed job IDs before quota and rejects outage before mutation", async () => {
    const consume = vi.spyOn(operationLimiter, "consume").mockRejectedValue(new RateLimiterUnavailableError());
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.pathpilot.derivedAnalysis.retry({ id: "invalid" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(consume).not.toHaveBeenCalled();
    await expect(caller.pathpilot.derivedAnalysis.retry({ id: job })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(analysis.retryDerivedAnalysis).not.toHaveBeenCalled();
    await expect(caller.pathpilot.derivedAnalysis.status()).resolves.toMatchObject({ job: null });
  });
});

describe("optional administrator owner notifications", () => {
  const input = { title: "Fictional operational notice", content: "Synthetic local test only" };
  it("preserves success and caps repeated notifications independently of source refresh", async () => {
    const consume = sharedAdmission(), caller = appRouter.createCaller(context());
    for (let index = 0; index < 3; index++) await expect(caller.system.notifyOwner(input)).resolves.toEqual({ success: true });
    await expect(caller.system.notifyOwner(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(notifications.notifyOwner).toHaveBeenCalledTimes(3);
    expect(consume).toHaveBeenCalledWith("owner-notification:application", "api:sensitive", 3, 1800);
    await expect(caller.pathpilot.opportunities.refreshNasaSource()).resolves.toMatchObject({ id: "example" });
  });
  it("bounds concurrent administrator callers through shared admission objects", async () => {
    sharedAdmission();
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => appRouter.createCaller(context()).system.notifyOwner(input)));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(3); expect(notifications.notifyOwner).toHaveBeenCalledTimes(3);
  });
  it("does not call a webhook on quota outage and leaves auth/health available", async () => {
    vi.spyOn(operationLimiter, "consume").mockRejectedValue(new RateLimiterUnavailableError());
    const ctx = context(), caller = appRouter.createCaller(ctx);
    await expect(caller.system.notifyOwner(input)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(notifications.notifyOwner).not.toHaveBeenCalled();
    await expect(caller.auth.me()).resolves.toEqual(ctx.user);
    await expect(caller.system.health({ timestamp: 1 })).resolves.toEqual({ ok: true });
  });
  it("retains validation/authorization ordering without charging invalid requests", async () => {
    const consume = sharedAdmission();
    await expect(appRouter.createCaller(context("user")).system.notifyOwner(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).system.notifyOwner({ title: "", content: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(consume).not.toHaveBeenCalled();
  });
});

const publicContext = (address = "192.0.2.10") => ({ ...context(), user: null, supabase: null, req: { headers: {}, socket: { remoteAddress: address } } }) as unknown as TrpcContext;
describe("anonymous shared-report data admission only", () => {
  const token = "a".repeat(43);
  it("preserves a normal result and does not key capacity by the report token", async () => {
    const consume = sharedAdmission(), caller = appRouter.createCaller(publicContext());
    await expect(caller.pathpilot.sharedReport.get({ token })).resolves.toMatchObject({ method: "Synthetic public counts" });
    expect(consume.mock.calls.map(call => call[0])).toEqual(["public-data:ip:192.0.2.10", "public-data:application"]);
    expect(JSON.stringify(consume.mock.calls)).not.toContain(token);
  });
  it("bounds concurrent requests and varied-token retries without accepting spoofed direct-host forwarding headers", async () => {
    vi.stubEnv("VERCEL", ""); sharedAdmission();
    const results = await Promise.allSettled(Array.from({ length: 121 }, (_, index) => {
      const ctx = publicContext(); ctx.req.headers["x-forwarded-for"] = `198.51.100.${index}`;
      return appRouter.createCaller(ctx).pathpilot.sharedReport.get({ token: `${"a".repeat(42)}${index % 2 ? "b" : "c"}` });
    }));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(120);
    expect(db.getSharedPlanningReport).toHaveBeenCalledTimes(120);
  });
  it("enforces global capacity across independent admission objects and different source addresses", async () => {
    sharedAdmission();
    const results = await Promise.allSettled(Array.from({ length: 601 }, (_, index) => appRouter.createCaller(publicContext(`192.0.2.${index % 6 + 1}`)).pathpilot.sharedReport.get({ token })));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(600);
    expect(db.getSharedPlanningReport).toHaveBeenCalledTimes(600);
  });
  it("fails only data lookup on outage, leaving health/auth independent with no stale-data fallback", async () => {
    vi.spyOn(operationLimiter, "consume").mockRejectedValue(new RateLimiterUnavailableError());
    const caller = appRouter.createCaller(publicContext());
    await expect(caller.pathpilot.sharedReport.get({ token })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(db.getSharedPlanningReport).not.toHaveBeenCalled();
    await expect(caller.auth.me()).resolves.toBeNull();
    await expect(caller.system.health({ timestamp: 1 })).resolves.toEqual({ ok: true });
  });
  it("retains token validation before admission and existing null/unavailable report semantics", async () => {
    const consume = sharedAdmission(), caller = appRouter.createCaller(publicContext());
    await expect(caller.pathpilot.sharedReport.get({ token: "invalid" })).rejects.toMatchObject({ code: "BAD_REQUEST" }); expect(consume).not.toHaveBeenCalled();
    db.getSharedPlanningReport.mockResolvedValue(null);
    await expect(caller.pathpilot.sharedReport.get({ token })).resolves.toBeNull();
  });
});

describe("public portfolio shares anonymous data capacity", () => {
  it("preserves the existing public result and uses the same address/application budgets", async () => {
    const consume = sharedAdmission(); db.getPublicPortfolio.mockResolvedValue({ projects: [] });
    await expect(appRouter.createCaller(publicContext()).pathpilot.portfolio.public({ handle: "example-work" })).resolves.toEqual({ projects: [] });
    expect(consume.mock.calls.map(call => call[0])).toEqual(["public-data:ip:192.0.2.10", "public-data:application"]);
  });
  it("prevents handle changes and alternating public routes from bypassing per-address capacity", async () => {
    sharedAdmission(); const caller = appRouter.createCaller(publicContext());
    for (let index = 0; index < 120; index++) await (index % 2 ? caller.pathpilot.portfolio.public({ handle: `example-${index}` }) : caller.pathpilot.sharedReport.get({ token: "a".repeat(43) }));
    await expect(caller.pathpilot.portfolio.public({ handle: "another-example" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(db.getPublicPortfolio).toHaveBeenCalledTimes(60);
  });
  it("bounds mixed public routes through independent admission objects concurrently", async () => {
    sharedAdmission(); const a = appRouter.createCaller(publicContext()), b = appRouter.createCaller(publicContext());
    const results = await Promise.allSettled(Array.from({ length: 121 }, (_, index) => index % 2 ? a.pathpilot.portfolio.public({ handle: "example-work" }) : b.pathpilot.sharedReport.get({ token: "a".repeat(43) })));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(120);
    expect(db.getPublicPortfolio.mock.calls.length + db.getSharedPlanningReport.mock.calls.length).toBe(120);
  });
  it("does not query public records when quotas fail, and does not affect health or account context", async () => {
    vi.spyOn(operationLimiter, "consume").mockRejectedValue(new RateLimiterUnavailableError()); const caller = appRouter.createCaller(publicContext());
    await expect(caller.pathpilot.portfolio.public({ handle: "example-work" })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(db.getPublicPortfolio).not.toHaveBeenCalled();
    await expect(caller.auth.me()).resolves.toBeNull(); await expect(caller.system.health({ timestamp: 1 })).resolves.toEqual({ ok: true });
  });
  it("rejects invalid handles before admission and retains null for unavailable portfolios", async () => {
    const consume = sharedAdmission(), caller = appRouter.createCaller(publicContext());
    await expect(caller.pathpilot.portfolio.public({ handle: "../../private" })).rejects.toMatchObject({ code: "BAD_REQUEST" }); expect(consume).not.toHaveBeenCalled();
    await expect(caller.pathpilot.portfolio.public({ handle: "example-work" })).resolves.toBeNull();
  });
});
