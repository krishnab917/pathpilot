import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoadmap, type RoadmapMilestoneInput } from "../server/db";
import { runWithSupabaseClient } from "../server/supabase";

// Characterization of the existing nontransactional repository, not proof of
// atomicity. Replace residual-state expectations with rollback expectations
// when the reviewed transaction RPC is implemented. No hosted DB is contacted.
const owner = "11111111-1111-4111-8111-111111111111";
const milestone: RoadmapMilestoneInput = {
  year: 1, title: "Explore a fictional project", category: "project",
  priority: "medium", estimatedHours: 2, resources: [], sortOrder: 0,
};
afterEach(() => vi.unstubAllGlobals());

function fixture(failure: "archive" | "roadmap" | "milestones") {
  const calls: { table: string; method: string; ownerFilter: string | null; body: any }[] = [];
  const rows = [{ id: "old", user_id: owner, status: "active" }];
  vi.stubGlobal("fetch", vi.fn(async (input: string, init: RequestInit) => {
    const url = new URL(String(input));
    const table = url.pathname.split("/").at(-1)!;
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(String(init.body)) : null;
    calls.push({ table, method, body, ownerFilter: url.searchParams.get("user_id") });
    const fail = () => Response.json({ message: "synthetic failure" }, { status: 400 });
    if (table === "roadmaps" && method === "PATCH") {
      if (failure === "archive") return fail();
      rows[0].status = "archived";
      return new Response(null, { status: 204 });
    }
    if (table === "roadmaps" && method === "POST") {
      if (failure === "roadmap") return fail();
      const row = { id: "new", ...body, status: "active" };
      rows.push(row);
      return Response.json(row);
    }
    if (table === "roadmap_milestones" && method === "POST") return fail();
    throw new Error("Unexpected repository request in failure fixture");
  }));
  const client = createClient("https://roadmap-audit.invalid", "offline-public-fixture", {
    auth: { persistSession: false },
    global: { headers: { Authorization: "Bearer fictional-owner-session" } },
  });
  return { calls, rows, run: () => runWithSupabaseClient(client, () => createRoadmap(owner, "Teacher", [milestone])) };
}

describe("roadmap partial-failure audit (offline characterization)", () => {
  it("stops before inserts if archiving fails and scopes the archive to its owner", async () => {
    const f = fixture("archive");
    await expect(f.run()).rejects.toThrow("We could not save your PathPilot data");
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].ownerFilter).toBe(`eq.${owner}`);
    expect(f.rows[0].status).toBe("active");
  });
  it("exposes the existing archived-plan residual when replacement insertion fails", async () => {
    const f = fixture("roadmap");
    await expect(f.run()).rejects.toThrow();
    expect(f.calls.map(c => c.method)).toEqual(["PATCH", "POST"]);
    expect(f.calls[1].body.user_id).toBe(owner);
    expect(f.rows).toEqual([{ id: "old", user_id: owner, status: "archived" }]);
  });
  it("exposes the existing empty replacement when milestone insertion fails", async () => {
    const f = fixture("milestones");
    await expect(f.run()).rejects.toThrow();
    expect(f.calls.map(c => c.table)).toEqual(["roadmaps", "roadmaps", "roadmap_milestones"]);
    expect(f.rows.map(row => row.status)).toEqual(["archived", "active"]);
    expect(f.calls[2].body[0].roadmap_id).toBe("new");
  });
});
