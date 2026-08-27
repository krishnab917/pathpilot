import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260827_checkpoint65_shared_ai_rate_limits.sql"), "utf8");

describe("shared AI rate-limit migration", () => {
  it("uses shared, expiring, fixed-window, RLS-protected state with atomic server-only functions", () => {
    expect(migration).toContain("pathpilot_rate_limit_windows");
    expect(migration).toContain("pathpilot_rate_limit_leases");
    expect((migration.match(/enable row level security/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(migration).toContain("security definer");
    expect(migration).toContain("on conflict (key_hash, action, window_started_at) do update");
    expect(migration).toContain("floor(extract(epoch from now_at) / p_window_seconds)");
    expect(migration).toContain("window_at + make_interval(secs => p_window_seconds)");
    expect(migration).toContain("revoke all on function public.consume_pathpilot_rate_limit");
    expect(migration).toContain("to service_role");
    expect(migration).not.toMatch(/grant execute[\s\S]*to authenticated/i);
  });
});
