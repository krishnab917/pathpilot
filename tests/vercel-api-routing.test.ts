import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));

// These source expressions use regex syntax (not named path parameters).
// The API expression is also validated with Vercel's routing-utils compiler.
function destination(path: string): string | undefined {
  return config.rewrites.find((route: { source: string }) =>
    new RegExp(`^${route.source}$`).test(path)
  )?.destination;
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

  it.each(["/", "/auth", "/app", "/app/roadmap", "/schools", "/counselors", "/parents", "/apiary"])("preserves the frontend route %s", path => {
    expect(destination(path)).toBe("/index.html");
  });
});
