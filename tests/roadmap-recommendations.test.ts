import { describe, expect, it } from "vitest";
import { getNationalEducationContext } from "../server/roadmap/national-context";
import { buildCountryAwareRecommendations } from "../server/roadmap/recommendations";

const base = { career: "Machine Learning Engineer", grade: "Grade 10", skills: ["Research"], activities: ["Robotics"], existingTitles: [], strongestTraits: ["analytical_thinking", "experimentation"] };

describe("country-aware roadmap recommendations", () => {
  it("changes the national planning recommendation for different countries", () => {
    const us = buildCountryAwareRecommendations({ ...base, countryCode: "US" });
    const india = buildCountryAwareRecommendations({ ...base, countryCode: "IN" });
    expect(us.some(item => item.title.includes("United States"))).toBe(true);
    expect(india.some(item => item.title.includes("India"))).toBe(true);
    expect(us.at(-1)?.description).not.toBe(india.at(-1)?.description);
  });

  it("removes redundant foundation and project suggestions when the student already has that evidence", () => {
    const recommendations = buildCountryAwareRecommendations({ ...base, countryCode: "GB", skills: ["Python", "Programming"], existingTitles: ["Machine Learning Engineer project"] });
    expect(recommendations.some(item => item.title.includes("technical foundation"))).toBe(false);
    expect(recommendations.some(item => item.title.includes("evidence-rich"))).toBe(false);
  });

  it("uses transparent unsupported-country guidance instead of fabricated national requirements", () => {
    const context = getNationalEducationContext("BR");
    expect(context.code).toBe("ZZ");
    expect(context.sourceNote).toContain("not yet available");
  });
});
