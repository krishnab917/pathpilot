import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../server/_core/env", () => ({ ENV: { llmApiKey: "offline-test-sentinel", llmApiBaseUrl: "https://provider.invalid", llmModel: "test-model" } }));
import { invokeLLM } from "../server/_core/llm";

describe("LLM adapter response boundary (no live provider)", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it.each([null, {}, { choices: [] }, { choices: [{ message: null }] },
    { choices: [{ message: { content: null, refusal: "private refusal" }, finish_reason: "stop" }] },
    { choices: [{ message: { content: "partial" }, finish_reason: "length" }] },
  ])("rejects unusable completion envelopes safely", async payload => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));
    await expect(invokeLLM({ messages: [{ role: "user", content: "private prompt" }] })).rejects.toMatchObject({ category: "invalid_response" });
    const logs = JSON.stringify([...vi.mocked(console.info).mock.calls, ...vi.mocked(console.warn).mock.calls]);
    expect(logs).not.toContain("private");
    expect(logs).not.toContain("offline-test-sentinel");
  });
  it("preserves the real completion and existing URL/model/schema contract", async () => {
    const payload = { choices: [{ message: { content: '{"reply":"valid"}' }, finish_reason: "stop" }] };
    const fetch = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetch);
    const schema = { name: "test", schema: { type: "object" }, strict: true };
    await expect(invokeLLM({ messages: [{ role: "user", content: "private prompt" }], outputSchema: schema })).resolves.toEqual(payload);
    expect(fetch.mock.calls[0][0]).toBe("https://provider.invalid/v1/chat/completions");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ model: "test-model", response_format: { type: "json_schema", json_schema: schema } });
  });
});
