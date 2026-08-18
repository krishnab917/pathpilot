import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ processNextDerivedAnalysis: vi.fn(), isValidDerivedAnalysisWorkerToken: vi.fn() }));
vi.mock("../server/derived-analysis", async importOriginal => ({ ...(await importOriginal<typeof import("../server/derived-analysis")>()), processNextDerivedAnalysis: mocks.processNextDerivedAnalysis, isValidDerivedAnalysisWorkerToken: mocks.isValidDerivedAnalysisWorkerToken }));

import { handleDerivedAnalysisWorker } from "../server/derived-analysis-handler";

function response() {
  const value: any = { status: vi.fn(), json: vi.fn() };
  value.status.mockReturnValue(value); return value;
}

describe("derived analysis worker handler", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects ordinary requests without the service-verified worker token", async () => {
    mocks.isValidDerivedAnalysisWorkerToken.mockResolvedValue(false);
    const res = response();
    await handleDerivedAnalysisWorker({ body: { token: "invalid" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mocks.processNextDerivedAnalysis).not.toHaveBeenCalled();
  });

  it("processes one queued job only for a valid signed worker call", async () => {
    mocks.isValidDerivedAnalysisWorkerToken.mockResolvedValue(true); mocks.processNextDerivedAnalysis.mockResolvedValue({ processed: true, jobId: "job-1", status: "completed" });
    const res = response();
    await handleDerivedAnalysisWorker({ body: { token: "valid-worker-token" } } as any, res);
    expect(mocks.processNextDerivedAnalysis).toHaveBeenCalledOnce();
    expect(res.json).toHaveBeenCalledWith({ ok: true, result: { processed: true, jobId: "job-1", status: "completed" } });
  });

  it("returns a generic recoverable error when worker processing fails", async () => {
    mocks.isValidDerivedAnalysisWorkerToken.mockResolvedValue(true); mocks.processNextDerivedAnalysis.mockRejectedValue(new Error("database details must remain private"));
    const res = response();
    await handleDerivedAnalysisWorker({ body: { token: "valid-worker-token" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "derived analysis worker failed", timestamp: expect.any(String) }));
  });
});
