import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoadmap } from "../server/db";
import { runWithSupabaseClient } from "../server/supabase";
// Transport test only. Real SQL rollback/ownership assertions run separately.
const owner = "11111111-1111-4111-8111-111111111111";
afterEach(() => vi.unstubAllGlobals());
describe("atomic roadmap repository", () => {
  it.each([null, "40001", "23514"])("uses one owner-session RPC for %s", async code => {
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)), headers: init.headers });
      return code ? Response.json({ code, message: "Private database detail" }, { status: 400 }) : Response.json({ id: "new", user_id: owner, target_career: "Teacher", status: "active", completion_percentage: 0, created_at: "2026-01-01", updated_at: "2026-01-01", milestones: [] });
    }));
    const db = createClient("https://roadmap.invalid", "offline-public-fixture", { auth: { persistSession: false }, global: { headers: { Authorization: "Bearer fictional-owner-session" } } });
    const operation = runWithSupabaseClient(db, () => createRoadmap(owner, "Teacher", [{ year: 1, title: "Practice", category: "project", priority: "medium", estimatedHours: 2, resources: [], sortOrder: 0 }], "old"));
    if (code === "40001") await expect(operation).rejects.toMatchObject({ code: "CONFLICT" });
    else if (code) await expect(operation).rejects.toThrow("We could not save");
    else expect((await operation).id).toBe("new");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/rpc/replace_roadmap_atomic");
    expect(calls[0].body).toMatchObject({ p_user_id: owner, p_expected_id: "old", p_target: "Teacher" });
    expect(new Headers(calls[0].headers).get("Authorization")).toBe("Bearer fictional-owner-session");
  });
});
