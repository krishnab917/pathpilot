import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../server/_core/app";
import { API_BODY_LIMIT, createIngressGuard, clientAddress } from "../server/http-security";

describe("API parsing and ingress boundaries", () => {
  let server: Server, origin: string;
  beforeAll(async () => {
    server = createServer(createApp());
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
  it("preserves normal public JSON and applies response protections", async () => {
    const response = await fetch(`${origin}/api/trpc/auth.me`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-powered-by")).toBeNull();
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(await response.json()).toMatchObject({ result: { data: { json: null } } });
  });
  it.each([
    ["/api/trpc/auth.logout", "application/json", JSON.stringify({ data: "x".repeat(API_BODY_LIMIT) }), 413],
    ["/api/trpc/auth.logout", "application/json", "{PRIVATE_SENTINEL", 400],
    ["/api/scheduled/derived-analysis", "text/plain", "x".repeat(4097), 413],
    ["/api/scheduled/derived-analysis", "application/json", "{PRIVATE_SENTINEL", 400],
    ["/api/trpc/auth.logout", "application/x-www-form-urlencoded", "value=" + "x".repeat(32769), 413],
  ])("safely rejects invalid/oversized %s payloads", async (route, type, body, status) => {
    const response = await fetch(origin + route, { method: "POST", headers: { "content-type": type as string }, body: body as string });
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.text()).not.toContain("PRIVATE_SENTINEL");
  });
  it("rejects cross-site mutations and oversized procedure batches before work starts", async () => {
    const response = await fetch(origin + "/api/trpc/auth.logout", { method: "POST", headers: { "sec-fetch-site": "cross-site" } });
    expect(response.status).toBe(403);
    const batch = await fetch(origin + "/api/trpc/" + Array(26).fill("auth.me").join(","));
    expect(batch.status).toBe(400);
  });
  it("bounds per-process counters without trusting spoofed IP headers", () => {
    vi.stubEnv("VERCEL", "");
    try {
      const guard = createIngressGuard({ maximum: 2, capacity: 1, now: () => 100 });
      const req = { originalUrl: "/api/trpc/auth.me", path: "/trpc/auth.me", method: "GET", headers: { "x-forwarded-for": "8.8.8.8" }, socket: { remoteAddress: "127.0.0.1" } } as any;
      const res: any = { status: vi.fn(), json: vi.fn(), set: vi.fn() };
      res.status.mockReturnValue(res); const next = vi.fn();
      expect(clientAddress(req)).toBe("127.0.0.1");
      guard(req, res, next); guard(req, res, next);
      req.headers["x-forwarded-for"] = "1.1.1.1";
      guard(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.set).toHaveBeenCalledWith("Retry-After", "120");
      req.socket.remoteAddress = "127.0.0.2"; guard(req, res, next);
      expect(res.status).toHaveBeenCalledWith(503);
    } finally { vi.unstubAllEnvs(); }
  });
});
