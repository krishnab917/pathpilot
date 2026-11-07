import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getOnboardingDraft, getStudentProfile, saveOnboardingDraft, saveStudentProfile } from "../server/db";
import { runWithSupabaseClient } from "../server/supabase";
import { emptyIntake } from "../shared/discovery-intake";

const owner = "11111111-1111-4111-8111-111111111111";
const input = { grade: "Grade 10", location: "Example region", countryCode: "US", educationSystem: "General", interests: [], skills: [], activities: [], careerPreferences: [] };
afterEach(() => vi.unstubAllGlobals());
function setup(failProfile = false) {
  const calls: { url: string; method: string; body: any; auth: string | null }[] = [];
  let profile: any = null, draft: any = null;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    const body = init.body ? JSON.parse(String(init.body)) : null;
    const method = init.method ?? "GET";
    calls.push({ url: String(url), method, body, auth: new Headers(init.headers).get("authorization") });
    if (String(url).includes("/student_profiles")) {
      if (method === "POST") {
        if (failProfile) return Response.json({ message: "Offline missing migration" }, { status: 400 });
        profile = { ...profile, ...body, id: owner, created_at: "2026-01-01" };
      }
      return Response.json(profile);
    }
    if (method === "POST") draft = body;
    if (method === "DELETE") { draft = null; return new Response(null, { status: 204 }); }
    return Response.json(draft);
  }));
  const db = createClient("https://onboarding.invalid", "offline-public-fixture", { auth: { persistSession: false }, global: { headers: { Authorization: "Bearer fictional-owner-session" } } });
  return { calls, run: <T>(fn: () => Promise<T>) => runWithSupabaseClient(db, fn) };
}
describe("onboarding repository contract (offline transport)", () => {
  it("round-trips a partial draft and stage with the request owner's client", async () => {
    const { run, calls } = setup();
    const partial = { ...input, grade: "", discoveryIntake: { ...emptyIntake(), fields: ["trades"] } };
    await run(() => saveOnboardingDraft(owner, 2, partial));
    expect(await run(() => getOnboardingDraft(owner))).toEqual({ currentStep: 2, payload: partial });
    expect(calls[0].body.user_id).toBe(owner);
    expect(calls.every(call => call.auth === "Bearer fictional-owner-session")).toBe(true);
    expect(new URL(calls[1].url).searchParams.get("user_id")).toBe(`eq.${owner}`);
  });
  it("preserves intake on legacy writes and scopes draft deletion", async () => {
    const { run, calls } = setup();
    const intake = { ...emptyIntake(), fields: ["education" as const] };
    await run(() => saveStudentProfile(owner, { ...input, discoveryIntake: intake }));
    await run(() => saveStudentProfile(owner, input));
    expect((await run(() => getStudentProfile(owner)))?.discoveryIntake).toEqual(intake);
    expect(calls.filter(call => call.method === "POST")[1].body).not.toHaveProperty("discovery_intake");
    expect(calls.filter(call => call.method === "DELETE").every(call => new URL(call.url).searchParams.get("user_id") === `eq.${owner}`)).toBe(true);
  });
  it("keeps the resumable draft when profile persistence fails", async () => {
    const { run, calls } = setup(true);
    await expect(run(() => saveStudentProfile(owner, { ...input, discoveryIntake: emptyIntake() }))).rejects.toThrow();
    expect(calls.some(call => call.method === "DELETE")).toBe(false);
  });
});
