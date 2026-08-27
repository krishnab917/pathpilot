import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCountryAwareRecommendations } from "../server/roadmap/recommendations";
import { getCareerRequirementActions } from "../server/roadmap/career-requirements";
import { countryOptions, getNationalEducationContext, isCanonicalPlanningCountry } from "../server/roadmap/national-context";
import { buildMentorContext } from "../server/mentor-context";
import { simulationCareerCatalog } from "../server/simulation/catalog";

const base = { countryCode: "US", grade: "Grade 10", skills: [], activities: [], existingTitles: [], strongestTraits: ["analytical_thinking"], evolvingFocus: undefined };
const routerSource = readFileSync(resolve(process.cwd(), "server/routers/pathpilot.ts"), "utf8");
const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const onboardingSource = readFileSync(resolve(process.cwd(), "client/src/pages/Onboarding.tsx"), "utf8");
const roadmapSource = readFileSync(resolve(process.cwd(), "client/src/components/RoadmapExperience.tsx"), "utf8");

describe("all-career deterministic roadmap and country foundation", () => {
  it("provides a distinct deterministic primary-plus-exploration path for every approved simulation career", () => {
    const allTitles = new Set<string>();
    for (const career of simulationCareerCatalog) {
      const actions = getCareerRequirementActions(career.name);
      expect(actions, career.name).toHaveLength(4);
      expect(actions.filter(action => action.kind === "primary"), career.name).toHaveLength(3);
      expect(actions.filter(action => action.kind === "explore"), career.name).toHaveLength(1);
      expect(actions.every(action => action.requirementId && action.requirementLabel && action.coverageTerms.length > 0 && action.tip), career.name).toBe(true);
      const recommendations = buildCountryAwareRecommendations({ ...base, career: career.name });
      expect(recommendations.filter(item => item.intelligence?.kind === "primary"), career.name).toHaveLength(3);
      expect(recommendations.every(item => item.intelligence?.requirementLabel && item.intelligence.studentGap && item.intelligence.tip), career.name).toBe(true);
      for (const recommendation of recommendations.filter(item => item.intelligence?.kind === "primary")) allTitles.add(recommendation.title);
    }
    expect(allTitles.size).toBeGreaterThanOrEqual(42);
  });

  it("returns the same country-career-grade-profile input in deterministic order", () => {
    const context = { ...base, career: "Cybersecurity Analyst", countryCode: "GB", grade: "Grade 11", skills: ["Networking"] };
    expect(buildCountryAwareRecommendations(context)).toEqual(buildCountryAwareRecommendations(context));
  });

  it("varies the same software and medicine pathways across United States, India, and United Kingdom", () => {
    for (const career of ["Software Engineer", "Doctor / Physician"]) {
      const us = buildCountryAwareRecommendations({ ...base, career, countryCode: "US" });
      const india = buildCountryAwareRecommendations({ ...base, career, countryCode: "IN" });
      const uk = buildCountryAwareRecommendations({ ...base, career, countryCode: "GB" });
      expect(us[0]?.description, `${career} US/IN`).not.toBe(india[0]?.description);
      expect(us[0]?.description, `${career} US/GB`).not.toBe(uk[0]?.description);
      expect(india[0]?.description, `${career} IN/GB`).not.toBe(uk[0]?.description);
    }
  });

  it("changes grade-appropriate project scope without changing the required career binding", () => {
    const early = buildCountryAwareRecommendations({ ...base, career: "Data Scientist", grade: "Grade 9" });
    const advanced = buildCountryAwareRecommendations({ ...base, career: "Data Scientist", grade: "Grade 12" });
    expect(early[1]?.title).not.toBe(advanced[1]?.title);
    expect(early[1]?.intelligence?.requirementId).toBe("data-analysis-evidence");
    expect(advanced[1]?.intelligence?.requirementId).toBe("data-analysis-evidence");
  });

  it("publishes exactly the requested fifty canonical planning countries with stable code, label, and region metadata", () => {
    expect(countryOptions).toHaveLength(50);
    expect(new Set(countryOptions.map(country => country.code)).size).toBe(50);
    expect(new Set(countryOptions.map(country => country.label)).size).toBe(50);
    expect(countryOptions.map(country => country.label)).toEqual(expect.arrayContaining(["United States", "Canada", "United Kingdom", "India", "Singapore", "Japan", "United Arab Emirates", "Germany", "Brazil", "South Africa", "Bangladesh"]));
    expect(countryOptions.every(country => country.region && country.educationSystem)).toBe(true);
  });

  it("distinguishes detailed general country context from canonical general context and unknown country context", () => {
    expect(getNationalEducationContext("US").detailLevel).toBe("verified-general");
    expect(getNationalEducationContext("CA")).toMatchObject({ label: "Canada", detailLevel: "general" });
    expect(getNationalEducationContext("ZZ").detailLevel).toBe("unknown");
    expect(isCanonicalPlanningCountry("ca")).toBe(true);
    expect(isCanonicalPlanningCountry("ZZ")).toBe(false);
  });

  it("keeps country changes limited to student-profile context rather than deleting or replacing goals, projects, or roadmaps", () => {
    expect(routerSource).toContain("updateCountry: protectedProcedure");
    expect(routerSource).toContain("refine(isCanonicalPlanningCountry");
    expect(routerSource).toContain("updateStudentCountryContext(ctx.user.id");
    const updateFunction = dbSource.slice(dbSource.indexOf("export async function updateStudentCountryContext"), dbSource.indexOf("export async function", dbSource.indexOf("export async function updateStudentCountryContext") + 1));
    expect(updateFunction).toContain("student_profiles");
    expect(updateFunction).not.toContain("roadmaps");
    expect(updateFunction).not.toContain("goals");
    expect(updateFunction).not.toContain("projects");
  });

  it("keeps one primary planning country searchable and region-grouped in onboarding, with a separate explicit pending-recommendation refresh choice", () => {
    expect(onboardingSource).toContain("Search planning country");
    expect(onboardingSource).toContain("<optgroup");
    expect(onboardingSource).toContain("This is your one primary roadmap country");
    expect(roadmapSource).toContain("Keep current roadmap");
    expect(roadmapSource).toContain("Refresh recommendations");
  });

  it("passes planning country, education stage, and active career as structured mentor context", () => {
    const context = JSON.parse(buildMentorContext({ request: "How does my career direction affect my roadmap?", profile: { countryCode: "GB", grade: "Grade 11", careerPreferences: [] }, roadmap: { targetCareer: "Lawyer", completionPercentage: 0, milestones: [] }, goals: [], projects: [], simulation: null, history: [] }).prompt);
    expect(context.student_summary.career_direction).toBe("Lawyer");
    expect(context.student_summary.planning_country).toBe("United Kingdom");
    expect(context.student_summary.grade).toBe("Grade 11");
    expect(routerSource).toContain("getMentorContextData(ctx.user.id, contextNeeds)");
  });
});
