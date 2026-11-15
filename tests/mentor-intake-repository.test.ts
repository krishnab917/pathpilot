import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: () => mocks.client }));
import { getMentorContextData } from "../server/db";
import { buildMentorContext } from "../server/mentor-context";

describe("Mentor onboarding repository boundary", () => {
  it.each(["student-a", "student-b"])("scopes new intake reads to %s and projects only allowed fields", async userId => {
    const queries: any[] = [];
    mocks.client = { from: vi.fn((table: string) => {
      const query: any = { table, select: vi.fn(), eq: vi.fn(), neq: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn() };
      for (const method of ["select", "eq", "neq", "order", "limit"]) query[method].mockReturnValue(query);
      const result = () => ({ error: null, data: table === "student_profiles" ? {
        grade: "11", interests: [userId === "student-a" ? "baking" : "aviation"],
        discovery_intake: { version: "discovery-intake-v1", fields: [userId === "student-a" ? "hospitality" : "transport"] },
        user_id: "PRIVATE_ID", private_note: "NEVER_FORWARD",
      } : table === "roadmaps" || table === "simulations" ? null : [] });
      query.maybeSingle.mockImplementation(async () => result());
      query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve);
      queries.push(query); return query;
    }) };
    const data = await getMentorContextData(userId, { careerProfile: true, projects: true, simulation: true });
    for (const query of queries) expect(query.eq).toHaveBeenCalledWith("user_id", userId);
    expect(queries[0].select).toHaveBeenCalledWith("grade, country_code, career_preferences, interests, skills, activities, discovery_intake");
    const prompt = buildMentorContext({ ...data, request: "Explore career directions", history: [] }).prompt;
    expect(prompt).toContain(userId === "student-a" ? "baking" : "aviation");
    expect(prompt).not.toContain(userId === "student-a" ? '"declared_interests":["aviation"]' : '"declared_interests":["baking"]');
    expect(prompt).not.toContain("NEVER_FORWARD");
    expect(prompt).not.toContain("PRIVATE_ID");
    queries.length = 0;
    const narrow = await getMentorContextData(userId, { careerProfile: false, projects: false, simulation: false });
    expect(queries[0].select).toHaveBeenCalledWith("grade, country_code");
    expect(narrow.profile).not.toHaveProperty("discoveryIntake");
    expect(queries.map(query => query.table)).toEqual(["student_profiles", "roadmaps", "goals"]);
  });
});
