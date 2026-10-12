import { createServer, type Server } from "node:http";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { serveStatic } from "../server/_core/vite";

describe("production public HTML and private SPA boundaries", () => {
  let server: Server;
  let directory: string;
  let origin: string;
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "pathpilot-html-test-"));
    await mkdir(join(directory, "parents"));
    await writeFile(join(directory, "index.html"), "<h1>Public overview</h1>");
    await writeFile(
      join(directory, "parents/index.html"),
      "<h1>Parent experience</h1>"
    );
    await writeFile(
      join(directory, "app-shell.html"),
      '<meta name="robots" content="noindex,follow"><div id="root"></div>'
    );
    await writeFile(
      join(directory, "404.html"),
      '<meta name="robots" content="noindex,follow"><h1>Page not found</h1>'
    );
    const app = express();
    app.use("/api", (_req, res) =>
      res.status(401).json({ error: "Authentication required" })
    );
    app.get("/manus-storage/*", (_req, res) =>
      res.status(410).send("Storage unavailable")
    );
    serveStatic(app, directory);
    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing local test port");
    origin = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => {
    if (server)
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve()))
      );
    if (directory) await rm(directory, { recursive: true });
  });
  it("serves public content on direct requests and trailing-slash refreshes", async () => {
    for (const path of [
      "/",
      "/parents",
      "/parents/",
      "/parents/?source=referral",
    ]) {
      const response = await fetch(origin + path);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain(
        path === "/" ? "Public overview" : "Parent experience"
      );
    }
  });
  it.each([
    "/auth",
    "/auth/update-password",
    "/onboarding",
    "/app",
    "/app/roadmap",
    "/share/example-token",
    "/portfolio/example-handle",
  ])("serves a noindex empty shell for %s", async path => {
    const response = await fetch(origin + path);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("noindex,follow");
    expect(html).not.toContain("Public overview");
  });
  it("returns a real noindex 404 for unknown routes and missing assets", async () => {
    for (const path of ["/unknown", "/assets/missing.js"]) {
      const response = await fetch(origin + path);
      expect(response.status).toBe(404);
      expect(await response.text()).toContain("Page not found");
    }
  });
  it("leaves prior API and storage handlers in control", async () => {
    const api = await fetch(origin + "/api/trpc/pathpilot.dashboard.get");
    expect(api.status).toBe(401);
    expect(api.headers.get("content-type")).toContain("application/json");
    expect(await api.json()).toEqual({ error: "Authentication required" });
    expect((await fetch(origin + "/manus-storage/example")).status).toBe(410);
  });
});
