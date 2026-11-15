import { describe, expect, it } from "vitest";
import { careerFields, careerTaxonomy } from "../shared/career-taxonomy";
import { emptyIntake } from "../shared/discovery-intake";
import { careerDomainsFor, opportunityAlignment } from "../server/opportunities/career-alignment";
import { inferCareerDomains } from "../server/opportunities/curated-catalog-source";
import { buildMentorContext, mentorContextNeeds, type MentorContextInput } from "../server/mentor-context";

describe("expanded opportunity alignment", () => {
  it.each(careerFields)("resolves every stable ID and career title in %s", field => {
    for (const career of careerTaxonomy.filter(item => item.field === field)) {
      expect(careerDomainsFor(career.id)).toContain(field);
      expect(careerDomainsFor(career.name)).toEqual(careerDomainsFor(career.id));
    }
  });
  it("unions multiple explicit fields, interests and saved directions without imposing starting recommendations", () => {
    const result = opportunityAlignment({ discoveryIntake: { ...emptyIntake(), fields: ["hospitality", "sport"], direction: "ideas", careers: ["Electrician"] }, interests: ["aviation", "music"], careerPreferences: ["Teacher"] }, ["Registered Nurse"]);
    expect(result.fields).toEqual(expect.arrayContaining(["hospitality", "sport", "trades", "transport", "creative", "education", "healthcare"]));
    expect(result.domains).toEqual(expect.arrayContaining(["engineering", "design", "social-impact", "science"]));
    expect(new Set(result.domains).size).toBe(result.domains.length);
  });
  it("does not misclassify substring matches or force undecided profiles into technology", () => {
    expect(careerDomainsFor("hospitality")).toEqual(["hospitality"]);
    expect(careerDomainsFor("I enjoy parties and knitting")).toEqual([]);
    expect(opportunityAlignment(null, []).domains).toEqual([]);
    expect(opportunityAlignment({ discoveryIntake: { version: "invalid" } }, []).domains).toEqual([]);
    expect(opportunityAlignment(null, ["Research Scientist"]).domains).toContain("science");
    expect(opportunityAlignment(null, ["Architect"]).domains).toContain("engineering");
  });
  it("tags new source records across non-STEM fields without default tags or modifying IDs", () => {
    expect(inferCareerDomains("Culinary baking competition")).toEqual(["hospitality"]);
    expect(inferCareerDomains("Aviation and logistics internship")).toEqual(["transport"]);
    expect(inferCareerDomains("Recreation and sports program")).toEqual(["sport"]);
    expect(inferCareerDomains("Something to try")).toEqual([]);
    expect(inferCareerDomains("Teaching and graphic design")).toEqual(expect.arrayContaining(["education", "creative"]));
  });
});

const base: MentorContextInput = { request: "Explore career directions", profile: null, roadmap: null, goals: [], projects: [], simulation: null, history: [] };
describe("structured Mentor exploration context", () => {
  it("includes editable, bounded self-reports and four shared-engine starting fields", () => {
    const profile = { grade: "11", interests: ["baking"], skills: ["food preparation"], activities: ["school kitchen club"], discoveryIntake: { ...emptyIntake(), fields: ["hospitality"], preferences: { practical: 1 }, direction: "ideas", careers: ["Chef"], pathways: ["apprenticeship"] } };
    const result = JSON.parse(buildMentorContext({ ...base, profile }).prompt).exploration_summary;
    expect(result.declared_interests).toEqual(["baking"]);
    expect(result.work_preferences).toEqual({ practical: 1 });
    expect(result.training_pathways).toEqual(["apprenticeship"]);
    expect(result.career_ideas).toEqual(["Chef"]);
    expect(result.starting_fields).toHaveLength(4);
    expect(result.starting_fields[0].field).toContain("Culinary");
    expect(result.interpretation).toContain("never restrict the destination");
    expect(result.starting_fields.every((field: object) => !("score" in field))).toBe(true);
  });
  it.each([null, { grade: "10" }, { grade: "10", discoveryIntake: { version: "bad", privateSecret: "NEVER_FORWARD" } }])("handles missing or invalid optional answers", profile => {
    const result = buildMentorContext({ ...base, profile });
    expect(result.prompt).not.toContain("NEVER_FORWARD");
    expect(JSON.parse(result.prompt).exploration_summary.starting_fields).toHaveLength(4);
  });
  it("allows questions outside starting fields and excludes intake for unrelated goal requests", () => {
    const profile = { grade: "11", discoveryIntake: { ...emptyIntake(), fields: ["technology"] } };
    expect(mentorContextNeeds("Could I explore baking instead?").careerProfile).toBe(true);
    expect(mentorContextNeeds("Tell me about Registered Nurse").careerProfile).toBe(true);
    const result = buildMentorContext({ ...base, profile, request: "Could I explore baking instead?" });
    expect(result.prompt).toContain("Support exploration outside these fields");
    expect(JSON.parse(buildMentorContext({ ...base, profile, request: "Prioritize my goals" }).prompt)).not.toHaveProperty("exploration_summary");
  });
  it("bounds malformed legacy lists and retains only the approved exploration history", () => {
    const result = buildMentorContext({ ...base, profile: { grade: "11", interests: Array(40).fill("x".repeat(500)), skills: [null, { secret: "NEVER_FORWARD" }] as any }, simulation: { career: "Teacher", resultSummary: "Compared classroom plans", strongestTraits: [], compatibility: [] } });
    const context = JSON.parse(result.prompt);
    expect(context.exploration_summary.declared_interests).toHaveLength(12);
    expect(context.exploration_summary.declared_interests[0]).toHaveLength(80);
    expect(context.simulation_summary.career).toBe("Teacher");
    expect(result.prompt).not.toContain("NEVER_FORWARD");
  });
});
