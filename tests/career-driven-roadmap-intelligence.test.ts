import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCountryAwareRecommendations } from "../server/roadmap/recommendations";
import { getCareerRequirementActions } from "../server/roadmap/career-requirements";
import { acceptedRecommendationDescription } from "../server/roadmap/recommendation-repository";

const repositorySource = readFileSync(resolve(process.cwd(), "server/roadmap/recommendation-repository.ts"), "utf8");
const base = { countryCode: "US", grade: "Grade 10", skills: [], activities: [], existingTitles: [], strongestTraits: ["analytical_thinking"], evolvingFocus: undefined };

describe("career-driven roadmap intelligence", () => {
  it("binds software-engineering primary actions to explicit career requirements rather than generic advice", () => {
    const recommendations = buildCountryAwareRecommendations({ ...base, career: "Software Engineer" });
    const primary = recommendations.filter(item => item.intelligence?.kind === "primary");
    expect(primary).toHaveLength(3);
    expect(primary.every(item => item.intelligence?.requirementId && item.intelligence.studentGap && item.intelligence.tip)).toBe(true);
    expect(primary.map(item => item.title).join(" ")).not.toContain("Improve technical skills");
    expect(primary.map(item => item.intelligence?.requirementLabel)).toEqual(expect.arrayContaining(["Computer science foundations", "Substantial software artifact"]));
  });

  it("changes the same career pathway meaningfully for country and grade context", () => {
    const usGrade10 = buildCountryAwareRecommendations({ ...base, career: "Software Engineer", countryCode: "US", grade: "Grade 10" });
    const indiaGrade10 = buildCountryAwareRecommendations({ ...base, career: "Software Engineer", countryCode: "IN", grade: "Grade 10" });
    const usGrade12 = buildCountryAwareRecommendations({ ...base, career: "Software Engineer", countryCode: "US", grade: "Grade 12" });
    expect(usGrade10[0]?.description).not.toBe(indiaGrade10[0]?.description);
    expect(usGrade10[1]?.title).not.toBe(usGrade12[1]?.title);
    expect(indiaGrade10[0]?.intelligence?.countryContext).toBe("India");
  });

  it("uses saved evidence to avoid redundant completed or active work", () => {
    const recommendations = buildCountryAwareRecommendations({ ...base, career: "Software Engineer", skills: ["Data structures"], existingTitles: ["Build a production app", "Technical subsystem ownership"] });
    expect(recommendations.some(item => item.intelligence?.requirementId === "software-cs-foundations")).toBe(false);
    expect(recommendations.some(item => item.intelligence?.requirementId === "software-portfolio-evidence")).toBe(false);
    expect(recommendations.some(item => item.intelligence?.requirementId === "software-collaboration")).toBe(false);
  });

  it("keeps medical, entrepreneurial, and environmental pathways distinct and career-specific", () => {
    const medicine = buildCountryAwareRecommendations({ ...base, career: "Doctor / Physician" });
    const startup = buildCountryAwareRecommendations({ ...base, career: "Entrepreneur / Startup Founder" });
    const environmental = buildCountryAwareRecommendations({ ...base, career: "Environmental Scientist" });
    expect(medicine.map(item => item.intelligence?.requirementLabel)).toEqual(expect.arrayContaining(["Science preparation", "Ethical healthcare exposure"]));
    expect(startup.map(item => item.intelligence?.requirementLabel)).toEqual(expect.arrayContaining(["Customer discovery", "Product validation"]));
    expect(environmental.map(item => item.intelligence?.requirementLabel)).toEqual(expect.arrayContaining(["Environmental science foundation", "Environmental data investigation"]));
    expect(medicine.map(item => item.title).join(" ")).not.toContain("external API");
  });

  it("places deterministic primary actions before lower-priority exploration and keeps all displayed metadata complete", () => {
    const recommendations = buildCountryAwareRecommendations({ ...base, career: "Entrepreneur / Startup Founder" });
    expect(recommendations.map(item => item.phase)).toEqual(["Do this next", "Do this next", "Do this next", "Explore"]);
    expect(recommendations.every(item => item.intelligence?.requirementLabel && item.intelligence.studentGap && item.intelligence.tip && item.intelligence.countryContext && item.intelligence.sourceLabel)).toBe(true);
    expect(recommendations.every(item => item.intelligence?.verificationStatus === "general")).toBe(true);
  });

  it("does not treat unsupported careers as a generic primary recommendation pathway", () => {
    expect(getCareerRequirementActions("Unverified career")).toEqual([]);
    expect(buildCountryAwareRecommendations({ ...base, career: "Unverified career" })).toEqual([]);
  });

  it("uses the active roadmap career as the primary recommendation target while retaining simulation context separately", () => {
    expect(repositorySource).toContain("career: context.roadmap?.targetCareer ?? context.simulation.career");
    expect(repositorySource).toContain("const targetCareer = context.roadmap?.targetCareer ?? context.simulation.career");
    expect(repositorySource).toContain("action_kind: item.intelligence?.kind");
  });

  it("preserves the career-intelligence explanation only when a student chooses to add a recommendation", () => {
    const recommendation = buildCountryAwareRecommendations({ ...base, career: "Software Engineer" })[0]!;
    const description = acceptedRecommendationDescription({
      description: recommendation.description,
      requirementLabel: recommendation.intelligence?.requirementLabel,
      studentGap: recommendation.intelligence?.studentGap,
      tip: recommendation.intelligence?.tip,
      countryContext: recommendation.intelligence?.countryContext,
      sourceLabel: recommendation.intelligence?.sourceLabel,
    } as ReturnType<typeof acceptedRecommendationDescription> extends never ? never : any);
    expect(description).toContain("Career requirement: Computer science foundations");
    expect(description).toContain("Why this:");
    expect(description).toContain("Tip:");
    expect(description).toContain("Planning country: United States");
    expect(description).toContain("Source: General recommendation");
  });
});
