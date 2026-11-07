import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCareerMatches, replaceCareerMatches, type CareerRecommendation } from "../server/db";
import { runWithSupabaseClient } from "../server/supabase";
import { simulationCareerCatalog } from "../server/simulation/catalog";

const owner = "11111111-1111-4111-8111-111111111111";
const matches: CareerRecommendation[] = simulationCareerCatalog.slice(0, 5).map(career => ({ name: career.name, description: "PRIVATE_DISCOVERY_SENTINEL", salaryRange: "Private estimate", educationRequirements: "Private pathway", requiredSkills: ["Research", "Communication", "Testing"], dailyResponsibilities: ["Investigate", "Report"], relatedCareers: ["One", "Two"], matchScore: 80, reasoning: "Owner specific", strengths: ["Research"], missingSkills: ["Practice"], realityCheck: "Requires practice", nextSteps: ["Explore", "Reflect"] }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("private discovery persistence boundary", () => {
  function setup(failSave = false) {
    vi.stubEnv("SUPABASE_URL", "https://catalog.invalid"); vi.stubEnv("SUPABASE_ANON_KEY", "offline-public-fixture"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "offline-service-fixture");
    const calls: { path: string; body: any; authorization: string | null; method: string | undefined }[] = [];
    let saved: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      const path = new URL(String(url)).pathname, authorization = new Headers(init.headers).get("authorization");
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ path, body, authorization, method: init.method });
      if (path.endsWith("/careers")) return Response.json({ id: `22222222-2222-4222-8222-${String(calls.length).padStart(12, "0")}` });
      if (path.endsWith("/replace_private_career_matches")) {
        if (failSave) return Response.json({ message: "fictional migration unavailable" }, { status: 400 });
        saved = body.p_matches;
        return new Response(null, { status: 204 });
      }
      expect(path).toBe("/rest/v1/career_matches");
      return Response.json(saved.map((item, index) => ({ ...item, id: `match-${index}`, rank: index + 1, generated_at: "2026-10-01T00:00:00Z", careers: { id: item.career_id, name: matches[index].name, description: "Authored public reference" } })));
    }));
    const db = createClient("https://catalog.invalid", "offline-public-fixture", { auth: { persistSession: false }, global: { headers: { Authorization: "Bearer fictional-owner-session" } } });
    return { calls, run: () => runWithSupabaseClient(db, () => replaceCareerMatches(owner, matches)), db };
  }
  it("sends only authored content through service_role and private generated fields through owner RPC", async () => {
    const { calls, run } = setup(); const result = await run();
    expect(result[0].career.description).toBe("PRIVATE_DISCOVERY_SENTINEL");
    const shared = calls.filter(call => call.path.endsWith("/careers"));
    expect(shared).toHaveLength(5);
    expect(JSON.stringify(shared)).not.toContain("PRIVATE_DISCOVERY_SENTINEL");
    expect(shared[0].body.description).toBe(simulationCareerCatalog[0].description);
    const privateCall = calls.find(call => call.path.endsWith("/replace_private_career_matches"))!;
    expect(privateCall.authorization).toBe("Bearer fictional-owner-session");
    expect(privateCall.body.p_matches[0]).not.toHaveProperty("user_id");
    expect(privateCall.body.p_matches[0].career_details.description).toBe("PRIVATE_DISCOVERY_SENTINEL");
  });
  it("fails without deleting existing matches when the migration/RPC is unavailable", async () => {
    const { calls, run } = setup(true);
    await expect(run()).rejects.toThrow("could not save");
    expect(calls.filter(call => call.path.endsWith("/career_matches")).every(call => call.method === "GET")).toBe(true);
  });
  it("refuses shared catalog writes before the additive migration exists", async () => {
    const { db } = setup();
    const fetcher = vi.fn(async (_url: string, _init: RequestInit) => Response.json({ message: "fictional missing column" }, { status: 400 }));
    vi.stubGlobal("fetch", fetcher);
    await expect(runWithSupabaseClient(db, () => replaceCareerMatches(owner, matches))).rejects.toThrow("could not save");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetcher.mock.calls[0][0])).pathname).toBe("/rest/v1/career_matches");
  });
  it("validates oversized generated details before any write", async () => {
    const { calls, db } = setup();
    await expect(runWithSupabaseClient(db, () => replaceCareerMatches(owner, [{ ...matches[0], description: "x".repeat(4001) }, ...matches.slice(1)]))).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
  it("reads historical matches with no private details", async () => {
    const { db } = setup();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([{ id: "legacy", generated_at: "2026-01-01", careers: { id: "career", name: "Software Engineer", description: "Historical reference", required_skills: ["Debugging"] } }])));
    const result = await runWithSupabaseClient(db, () => getCareerMatches(owner));
    expect(result[0].career.description).toBe("Historical reference");
    expect(result[0].career.requiredSkills).toEqual(["Debugging"]);
  });
  it("preserves migrated legacy fields even when old lists do not meet new generation minimums", async () => {
    const { db } = setup();
    const historical = { description: "Preserved original description", salaryRange: "Historical estimate", educationRequirements: "Historical pathway", requiredSkills: [], dailyResponsibilities: [], relatedCareers: [] };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([{ id: "legacy", generated_at: "2026-01-01", career_details: historical, careers: { id: "career", name: "Software Engineer", description: "New authored reference" } }])));
    const result = await runWithSupabaseClient(db, () => getCareerMatches(owner));
    expect(result[0].career).toMatchObject(historical);
  });
});
