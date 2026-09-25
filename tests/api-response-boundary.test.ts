import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../server/_core/app";

describe("API response boundary", () => {
  let server: Server;
  let origin: string;

  beforeAll(async () => {
    const app = createApp();
    // The SPA fallback is mounted after the API in both local server modes.
    app.use((_req, res) => res.type("html").send("<!doctype html><title>SPA</title>"));
    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test port");
    origin = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it("returns public tRPC JSON without credentials", async () => {
    const response = await fetch(`${origin}/api/trpc/auth.me`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toMatchObject({ result: { data: { json: null } } });
  });

  it("returns a tRPC 401 for the actual batched dashboard request without credentials", async () => {
    const input = encodeURIComponent(JSON.stringify({ 0: { json: null, meta: { values: ["undefined"] } } }));
    const response = await fetch(`${origin}/api/trpc/pathpilot.dashboard.get?batch=1&input=${input}`);
    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toMatchObject([{ error: { json: { data: { code: "UNAUTHORIZED" } } } }]);
  });

  it.each(["/api", "/api/missing", "/api/missing/nested"])("keeps %s out of the SPA fallback", async path => {
    const response = await fetch(`${origin}${path}`);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: { code: "NOT_FOUND", message: "API route not found." } });
  });

  it("returns JSON for a nonexistent tRPC procedure", async () => {
    const response = await fetch(`${origin}/api/trpc/noSuchProcedure`);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("returns a safe JSON parser error without echoing the body", async () => {
    const response = await fetch(`${origin}/api/trpc/auth.logout`, {
      method: "POST", headers: { "content-type": "application/json" }, body: "{private-test-marker",
    });
    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: { code: "BAD_REQUEST", message: "Invalid JSON request body." } });
  });

  it.each(["/", "/auth", "/app", "/app/roadmap", "/schools", "/counselors", "/parents"])("preserves SPA handling for %s", async path => {
    const response = await fetch(`${origin}${path}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });
});
