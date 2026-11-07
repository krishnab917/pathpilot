import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "../shared/safe-url";
import { assertDisposableSupabase } from "./disposable-supabase";
import { secretCategories } from "../scripts/security-scan.mjs";

describe("navigation and operational security", () => {
  it.each(["javascript:alert(1)", "data:text/html,test", "file:///etc/passwd", "https://user:password@example.com", "//example.com"])("rejects unsafe link %s", value => {
    expect(safeHttpUrl(value)).toBeUndefined();
  });
  it("retains ordinary HTTPS links", () => expect(safeHttpUrl("https://example.com/guide")).toBe("https://example.com/guide"));
  it("requires explicit disposable integration opt-in and matching project origins", () => {
    expect(() => assertDisposableSupabase({})).toThrow("opt-in");
    const env = { RUN_SUPABASE_INTEGRATION: "1", SUPABASE_TEST_DISPOSABLE: "1", SUPABASE_URL: "https://production.supabase.co" };
    expect(() => assertDisposableSupabase(env)).toThrow("disposable project");
    expect(() => assertDisposableSupabase({ ...env, SUPABASE_URL: "http://127.0.0.1:54321" })).not.toThrow();
    expect(() => assertDisposableSupabase({ ...env, NODE_ENV: "production" })).toThrow("opt-in");
  });
  it("detects secret categories without returning values and allows public anon JWTs", () => {
    const fake = "ghp_" + "A".repeat(36);
    expect(secretCategories(fake)).toEqual(["github-token"]);
    expect(JSON.stringify(secretCategories(fake))).not.toContain(fake);
    const payload = Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url");
    expect(secretCategories(`eyJhbGciOiJIUzI1NiJ9.${payload}.${"a".repeat(40)}`)).toEqual([]);
    expect(secretCategories("JWT_SECRET=" )).toEqual([]);
    expect(secretCategories("JWT_SECRET=\nOWNER_NOTIFICATION_WEBHOOK_SECRET=\n")).toEqual([]);
    expect(secretCategories("JWT_SECRET=" + "A".repeat(40))).toEqual(["literal-environment-secret"]);
  });
});
