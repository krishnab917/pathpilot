import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));

// These source expressions use regex syntax (not named path parameters).
// The API expression is also validated with Vercel's routing-utils compiler.
function destination(path: string): string | undefined {
  const route = config.rewrites.find((route: { source: string }) =>
    new RegExp(`^${route.source}$`).test(path)
  );
  return route ? path.replace(new RegExp(`^${route.source}$`), route.destination) : undefined;
}

describe("Vercel API namespace routing", () => {
  it.each([
    "/api", "/api/", "/api/missing", "/api/missing/", "/api//missing",
    "/api/trpc/auth.me", "/api/trpc/auth.me/",
    "/api/trpc/pathpilot.dashboard.get",
    "/api/trpc/auth.me,pathpilot.dashboard.get",
    "/api/scheduled/derived-analysis",
  ])("routes %s to the API function before the SPA fallback", path => {
    expect(destination(path)).toBe("/api/index");
  });

  it.each(["/", "/auth", "/app", "/app/roadmap", "/schools", "/counselors", "/parents"])("preserves the frontend route %s", path => {
    expect(destination(path)).toBe(path === "/" ? "/index.html" : ["/schools", "/counselors", "/parents"].includes(path) ? `${path}/index.html` : "/app-shell.html");
  });
  it("lets unknown paths reach the static 404 instead of the homepage", () => {
    expect(destination("/apiary")).toBeUndefined();
    expect(destination("/missing-page")).toBeUndefined();
  });
});
