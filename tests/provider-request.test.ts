import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestProviderJson } from "../server/ai/provider-request";

describe("bounded provider requests (offline fetch)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it.each([400, 401, 403, 404, 422])("does not retry HTTP %s or expose its body", async status => {
    const fetch = vi.fn().mockResolvedValue(new Response("PRIVATE_SENTINEL", { status }));
    vi.stubGlobal("fetch", fetch);
    await expect(requestProviderJson("https://provider.invalid", {})).rejects.toMatchObject({ category: "http", status });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("PRIVATE_SENTINEL");
  });
  it.each([408, 429, 500, 502, 503])("retries transient HTTP %s", async status => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response("", { status })).mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    const result = requestProviderJson("https://provider.invalid", {});
    await vi.runAllTimersAsync();
    await expect(result).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("honors Retry-After rather than retrying beyond the budget", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("", { status: 429, headers: { "retry-after": "120" } }));
    vi.stubGlobal("fetch", fetch);
    await expect(requestProviderJson("https://provider.invalid", {})).rejects.toMatchObject({ category: "http", status: 429 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each(["headers", "body"])("aborts a stalled %s request", async phase => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url, init) => {
      signal = init.signal;
      return phase === "headers" ? new Promise(() => {}) : Promise.resolve({ ok: true, status: 200, json: () => new Promise(() => {}) });
    }));
    const result = expect(requestProviderJson("https://provider.invalid", {}, 100)).rejects.toMatchObject({ category: "timeout" });
    await vi.advanceTimersByTimeAsync(101);
    await result;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("rejects malformed JSON without echoing it or retrying", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("<html>PRIVATE_SENTINEL"));
    vi.stubGlobal("fetch", fetch);
    await expect(requestProviderJson("https://provider.invalid", {})).rejects.toMatchObject({ category: "invalid_response" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("bounds network retries and sanitizes network errors", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("PRIVATE_SENTINEL"));
    vi.stubGlobal("fetch", fetch);
    const result = expect(requestProviderJson("https://provider.invalid", {})).rejects.toMatchObject({ category: "network" });
    await vi.runAllTimersAsync();
    await result;
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("PRIVATE_SENTINEL");
  });
});
