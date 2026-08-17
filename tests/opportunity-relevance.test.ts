import { describe, expect, it } from "vitest";
import { explainOpportunityRelevance, opportunityRelevanceMethod } from "../server/opportunities/relevance";

describe("opportunity relevance explanations", () => {
  it("explains only matched saved directions and organizer-published country/grade fields", () => {
    const reasons = explainOpportunityRelevance(
      { careerDomains: ["science", "technology"], countryCodes: ["US"], eligibleGrades: ["Grade 11"] },
      { careerDirections: ["Biomedical Researcher"], careerDomains: ["science"], countryCode: "US", grade: "Grade 11" },
    );

    expect(reasons).toEqual([
      "Aligned with your saved career direction: Biomedical Researcher.",
      "The organizer lists availability in your selected country.",
      "The organizer lists your current grade.",
    ]);
  });

  it("does not manufacture relevance when organizer data is absent or unrelated", () => {
    expect(explainOpportunityRelevance(
      { careerDomains: ["design"], countryCodes: [], eligibleGrades: [] },
      { careerDirections: ["Software Developer"], careerDomains: ["technology"], countryCode: "US", grade: "Grade 10" },
    )).toEqual([]);
  });

  it("states the non-diagnostic and non-behavioral method boundary", () => {
    expect(opportunityRelevanceMethod).toContain("does not use behavioral signals");
    expect(opportunityRelevanceMethod).toContain("personal score");
  });
});
