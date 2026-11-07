import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../server/routers";
import { currentSupabaseClient } from "../server/supabase";

describe("public portfolio anonymous database boundary", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("uses an anonymous client and published-only projection without a private request client", async () => {
    vi.stubEnv("SUPABASE_URL", "https://catalog.invalid");
    vi.stubEnv("SUPABASE_ANON_KEY", "offline-public-fixture");
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("apikey")).toBe("offline-public-fixture");
      expect(headers.get("authorization")).toBe("Bearer offline-public-fixture");
      if (String(url).includes("/portfolio_profiles?")) return Response.json({ user_id: "11111111-1111-4111-8111-111111111111", handle: "example-work", display_name: "Example work", introduction: null, updated_at: "2026-10-01T00:00:00Z" });
      expect(String(url)).toContain("/portfolio_projects?");
      const parsed = new URL(String(url));
      expect(parsed.searchParams.get("is_published")).toBe("eq.true");
      expect(parsed.searchParams.get("select")).not.toContain("project_notes");
      return Response.json([]);
    });
    vi.stubGlobal("fetch", fetcher);
    const caller = appRouter.createCaller({ user: null, supabase: null, req: {} as any, res: {} as any });
    await expect(caller.pathpilot.portfolio.public({ handle: "example-work" })).resolves.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(() => currentSupabaseClient()).toThrow("user-scoped");
  });
});
