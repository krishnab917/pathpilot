import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../server/_core/env", () => ({ ENV: { ownerNotificationWebhookUrl: "https://webhook.invalid", ownerNotificationWebhookSecret: "offline-webhook-test" } }));
import { notifyOwner } from "../server/_core/notification";
import { handleDerivedAnalysisWorker } from "../server/derived-analysis-handler";

describe("sanitized operational errors", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it("does not consume/log a failing webhook body or reflect a network exception", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("PRIVATE_SENTINEL", { status: 502 })).mockRejectedValueOnce(new Error("PRIVATE_SENTINEL")));
    await expect(notifyOwner({ title: "Example", content: "Fictional notification" })).resolves.toBe(false);
    await expect(notifyOwner({ title: "Example", content: "Fictional notification" })).resolves.toBe(false);
    expect(JSON.stringify(warning.mock.calls)).not.toContain("PRIVATE_SENTINEL");
    expect(warning).toHaveBeenCalledWith("[Notification] request rejected", { status: 502 });
  });
  it("returns a bounded malformed-worker error without logging body excerpts", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res: any = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res);
    await handleDerivedAnalysisWorker({ body: "{PRIVATE_SENTINEL" } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("PRIVATE_SENTINEL");
    expect(log).not.toHaveBeenCalled();
  });
});
