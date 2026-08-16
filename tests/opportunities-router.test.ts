import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const mocks = vi.hoisted(() => ({ listVerifiedOpportunities: vi.fn(), setStudentOpportunityState: vi.fn(), refreshNasaSpaceAppsOpportunity: vi.fn() }));

vi.mock("../server/db", async importOriginal => {
  const actual = await importOriginal<typeof import("../server/db")>();
  return { ...actual, listVerifiedOpportunities: mocks.listVerifiedOpportunities, setStudentOpportunityState: mocks.setStudentOpportunityState, refreshNasaSpaceAppsOpportunity: mocks.refreshNasaSpaceAppsOpportunity };
});

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const opportunityId = "22222222-2222-4222-8222-222222222222";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("pathpilot.opportunities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listVerifiedOpportunities.mockResolvedValue([]);
    mocks.setStudentOpportunityState.mockResolvedValue({ opportunityId, status: "saved" });
    mocks.refreshNasaSpaceAppsOpportunity.mockResolvedValue({ id: opportunityId, title: "NASA Space Apps Challenge 2026", verifiedAt: new Date("2026-08-16T00:00:00Z") });
  });

  it("reads verified opportunities only through the signed-in user context", async () => {
    await expect(appRouter.createCaller(context).pathpilot.opportunities.list()).resolves.toEqual([]);
    expect(mocks.listVerifiedOpportunities).toHaveBeenCalledWith(userId);
  });

  it("forwards the requested category and career-aligned scope under the signed-in user", async () => {
    await expect(appRouter.createCaller(context).pathpilot.opportunities.list({ category: "research", alignedOnly: true })).resolves.toEqual([]);
    expect(mocks.listVerifiedOpportunities).toHaveBeenCalledWith(userId, { category: "research", alignedOnly: true });
  });

  it("records a user-scoped save state for a valid opportunity identifier", async () => {
    await expect(appRouter.createCaller(context).pathpilot.opportunities.setState({ opportunityId, status: "saved" })).resolves.toEqual({ opportunityId, status: "saved" });
    expect(mocks.setStudentOpportunityState).toHaveBeenCalledWith(userId, opportunityId, "saved");
  });

  it("allows only an administrator to trigger the external official-source refresh", async () => {
    await expect(appRouter.createCaller(context).pathpilot.opportunities.refreshNasaSource()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.refreshNasaSpaceAppsOpportunity).not.toHaveBeenCalled();
    const adminContext = { ...context, user: { ...context.user!, role: "admin" as const } };
    await expect(appRouter.createCaller(adminContext).pathpilot.opportunities.refreshNasaSource()).resolves.toMatchObject({ title: "NASA Space Apps Challenge 2026" });
    expect(mocks.refreshNasaSpaceAppsOpportunity).toHaveBeenCalledOnce();
  });
});
