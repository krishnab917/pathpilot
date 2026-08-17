import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const mocks = vi.hoisted(() => ({ getCrossProductEvidenceSummary: vi.fn() }));
vi.mock("../server/db", async importOriginal => ({ ...(await importOriginal<typeof import("../server/db")>()), getCrossProductEvidenceSummary: mocks.getCrossProductEvidenceSummary }));

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("cross-product evidence policy router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCrossProductEvidenceSummary.mockResolvedValue({ policy: { purpose: "Read only", allowedSources: [], prohibitedSources: [], guardrails: [] }, availability: { completedSimulationCount: 1, planningActivityCount: 1, reflectionContextAvailable: true } });
  });

  it("returns the private read-only summary only through the authenticated student scope", async () => {
    await expect(appRouter.createCaller(context).pathpilot.evidencePolicy.summary()).resolves.toMatchObject({ availability: { reflectionContextAvailable: true } });
    expect(mocks.getCrossProductEvidenceSummary).toHaveBeenCalledWith(userId);
  });
});
