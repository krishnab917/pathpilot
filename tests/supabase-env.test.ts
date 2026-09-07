import { afterEach, describe, expect, it } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("Supabase environment configuration", () => {
  it("uses non-empty server Supabase values before public fallbacks", async () => {
    process.env.SUPABASE_URL = "https://server-project.supabase.co";
    process.env.SUPABASE_ANON_KEY = "server-anon-key";
    process.env.VITE_SUPABASE_URL = "https://browser-project.supabase.co";
    process.env.VITE_SUPABASE_ANON_KEY = "browser-anon-key";

    const { getSupabaseConfig } = await import("../server/supabase");

    expect(getSupabaseConfig()).toEqual({
      url: "https://server-project.supabase.co",
      key: "server-anon-key",
    });
  });

  it("treats empty placeholders as missing and falls back to Vite public values", async () => {
    process.env.SUPABASE_URL = "";
    process.env.SUPABASE_ANON_KEY = "   ";
    process.env.VITE_SUPABASE_URL = "https://browser-project.supabase.co";
    process.env.VITE_SUPABASE_ANON_KEY = "browser-anon-key";

    const { getSupabaseConfig } = await import("../server/supabase");

    expect(getSupabaseConfig()).toEqual({
      url: "https://browser-project.supabase.co",
      key: "browser-anon-key",
    });
  });

  it("keeps the service-role key server-only and does not support legacy aliases", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "  service-role-key  ";
    process.env.SUPABASE_KEY = "legacy-key";

    const { getOptionalSupabaseServiceRoleKey, getSupabaseServiceRoleKey } =
      await import("../server/supabase");

    expect(getOptionalSupabaseServiceRoleKey()).toBe("service-role-key");
    expect(getSupabaseServiceRoleKey("Test feature")).toBe("service-role-key");

    process.env.SUPABASE_SERVICE_ROLE_KEY = "";

    expect(getOptionalSupabaseServiceRoleKey()).toBeNull();
    expect(() => getSupabaseServiceRoleKey("Test feature")).toThrow(
      "Test feature is not configured."
    );
  });
});
