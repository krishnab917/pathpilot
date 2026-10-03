import { afterEach, describe, expect, it, vi } from "vitest";
import { timeAiStage, timeAiSync, traceAiRequest } from "../server/ai/request-timing";
import { aiErrorMessage } from "../client/src/lib/ai-error-message";

describe("sanitized AI timing", () => {
  afterEach(() => vi.restoreAllMocks());
  it("isolates concurrent requests and never records returned content or thrown errors", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const headers = new Map<string, string>();
    const response = { getHeader: (name: string) => headers.get(name), setHeader: (name: string, value: string) => headers.set(name, value) };
    await Promise.all([
      traceAiRequest("mentor", undefined, response, async () => {
        await timeAiStage("context", async () => { await new Promise(resolve => setTimeout(resolve, 5)); return "PRIVATE_STUDENT_CONTEXT"; });
        timeAiSync("prompt", () => "PRIVATE_PROMPT");
        return { ok: true, data: "PRIVATE_REPLY" };
      }),
      traceAiRequest("roadmap", undefined, response, async () => {
        try { await timeAiStage("save_result", async () => { throw new Error("SECRET_TOKEN_AND_PRIVATE_DATA"); }); } catch { /* tRPC returns a failed result */ }
        return { ok: false };
      }),
    ]);
    const logs = log.mock.calls.filter(call => call[0] === "[AI timing]").map(call => call[1]);
    expect(logs).toHaveLength(2);
    expect(new Set(logs.map(log => log.traceId)).size).toBe(2);
    expect(logs.find(log => log.operation === "mentor").spans.map((span: any) => span.stage)).toEqual(["context", "prompt", "total"]);
    expect(logs.find(log => log.operation === "roadmap").spans[0]).toMatchObject({ stage: "save_result", outcome: "error" });
    expect(JSON.stringify([...logs, ...headers])).not.toMatch(/PRIVATE|SECRET/);
    expect(headers.get("Server-Timing")).toContain("mentor_context");
    expect(headers.get("Server-Timing")).toContain("roadmap_save_result");
  });

  it("measures failed authentication and response completion without session information", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    let finish = () => {};
    await traceAiRequest("mentor", { receivedAt: performance.now() - 10, authenticationMs: 10, authenticated: false }, { once: (_event, callback) => { finish = callback; } }, async () => ({ ok: false }));
    finish();
    expect(log.mock.calls[0][1].spans[0]).toMatchObject({ stage: "authentication", outcome: "error", durationMs: 10 });
    expect(log.mock.calls[1][0]).toBe("[AI timing] response_sent");
  });
});

describe("AI failure copy", () => {
  it.each(["UNAUTHORIZED", "TOO_MANY_REQUESTS", "BAD_GATEWAY", "INTERNAL_SERVER_ERROR", undefined])("does not expose raw upstream content for %s", code => {
    expect(aiErrorMessage({ message: "SECRET_PROVIDER_BODY", data: { code } })).not.toContain("SECRET");
  });
  it("tells users to check saved results before retrying a deadline", () => {
    expect(aiErrorMessage({ message: "This request took too long. Internal context" })).toContain("Reload your saved results before retrying");
  });
});
