import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const mocks = vi.hoisted(() => ({ getDerivedAnalysisStatus: vi.fn(), requestDerivedAnalysis: vi.fn(), retryDerivedAnalysis: vi.fn(), cancelDerivedAnalysis: vi.fn() }));
vi.mock("../server/derived-analysis", async importOriginal => ({ ...(await importOriginal<typeof import("../server/derived-analysis")>()), getDerivedAnalysisStatus: mocks.getDerivedAnalysisStatus, requestDerivedAnalysis: mocks.requestDerivedAnalysis, retryDerivedAnalysis: mocks.retryDerivedAnalysis, cancelDerivedAnalysis: mocks.cancelDerivedAnalysis }));

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("derived analysis router", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getDerivedAnalysisStatus.mockResolvedValue({ job: null, currentSourceCount: 0 }); mocks.requestDerivedAnalysis.mockResolvedValue({ id: jobId, status: "queued" }); mocks.retryDerivedAnalysis.mockResolvedValue({ id: jobId, status: "queued" }); mocks.cancelDerivedAnalysis.mockResolvedValue({ id: jobId, status: "cancelled" }); });
  it("uses only the authenticated student identity for status and queue requests", async () => {
    await appRouter.createCaller(context).pathpilot.derivedAnalysis.status();
    await appRouter.createCaller(context).pathpilot.derivedAnalysis.request();
    expect(mocks.getDerivedAnalysisStatus).toHaveBeenCalledWith(userId);
    expect(mocks.requestDerivedAnalysis).toHaveBeenCalledWith(userId);
  });
  it("forwards retry and cancellation only with the authenticated student and selected job id", async () => {
    await appRouter.createCaller(context).pathpilot.derivedAnalysis.retry({ id: jobId });
    await appRouter.createCaller(context).pathpilot.derivedAnalysis.cancel({ id: jobId });
    expect(mocks.retryDerivedAnalysis).toHaveBeenCalledWith(userId, jobId);
    expect(mocks.cancelDerivedAnalysis).toHaveBeenCalledWith(userId, jobId);
  });
});
