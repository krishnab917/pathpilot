import { describe, expect, it, vi } from "vitest";
import { fetchSourceHtml } from "../server/opportunities/fetch-source";

describe("bounded public opportunity source fetching", () => {
  it("permits same-site HTTPS redirects while bounding time and response size", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: "https://www.example.com/page" } })).mockResolvedValueOnce(new Response("<h1>Public source</h1>"));
    await expect(fetchSourceHtml("https://example.com", fetcher)).resolves.toContain("Public source");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: "manual", signal: expect.any(AbortSignal) });
  });
  it.each(["http://127.0.0.1/private", "http://169.254.169.254/latest/meta-data", "https://other.example/private", "https://user:password@example.com"])("rejects redirect to %s before a second fetch", async location => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location } }));
    await expect(fetchSourceHtml("https://example.com", fetcher)).rejects.toThrow("redirect rejected");
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("rejects oversized HTML before parsing", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("x".repeat(2 * 1024 * 1024 + 1)));
    await expect(fetchSourceHtml("https://example.com", fetcher)).rejects.toThrow("size limit");
  });
});
