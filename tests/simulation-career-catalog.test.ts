import { describe, expect, it } from "vitest";
import {
  getSimulationCareer,
  relatedSimulationCareers,
  searchSimulationCareers,
  simulationCareerCatalog,
} from "../server/simulation/catalog";
import { buildAdaptiveResults } from "../server/simulation/engine";

describe("curated career simulation catalog", () => {
  it("defines exactly fifteen supported career simulations with complete selection metadata", () => {
    expect(simulationCareerCatalog).toHaveLength(15);
    expect(new Set(simulationCareerCatalog.map(career => career.id)).size).toBe(15);
    expect(new Set(simulationCareerCatalog.map(career => career.icon)).size).toBe(15);
    for (const career of simulationCareerCatalog) {
      expect(career.name).not.toBe("");
      expect(career.icon).not.toBe("");
      expect(career.description).not.toBe("");
      expect(career.description.length).toBeLessThanOrEqual(120);
      expect(career.simulationIntro).not.toBe("");
      expect(career.durationLabel).not.toBe("");
      expect(career.relatedCareerIds.length).toBeGreaterThan(0);
    }
  });

  it("recognizes only supported IDs and never substitutes an unsupported career", () => {
    expect(getSimulationCareer("doctor-physician")?.name).toBe("Doctor / Physician");
    expect(getSimulationCareer("astronaut")).toBeNull();
    expect(getSimulationCareer("unlisted-career")).toBeNull();
  });

  it("supports catalog search, category filtering, and nearby supported career alternatives", () => {
    expect(searchSimulationCareers("astronaut").map(career => career.id)).toEqual(["aerospace-engineer-astronaut"]);
    expect(searchSimulationCareers("", "Business & Finance").map(career => career.id)).toEqual([
      "entrepreneur-startup-founder",
      "product-manager",
      "financial-analyst",
    ]);
    expect(relatedSimulationCareers("aerospace-engineer-astronaut").map(career => career.id)).toContain("mechanical-engineer");
  });

  it("compares evidence against all supported careers rather than the simulated career alone", () => {
    const result = buildAdaptiveResults([
      { trait: "analytical_thinking", direction: 1, weight: 3, context: "technical", nodeId: "software-outage", decisionId: "investigate", difficulty: 3 },
      { trait: "problem_solving", direction: 1, weight: 3, context: "technical", nodeId: "software-outage", decisionId: "investigate", difficulty: 3 },
      { trait: "systems_thinking", direction: 1, weight: 3, context: "planning", nodeId: "software-architecture", decisionId: "model", difficulty: 3 },
      { trait: "attention_to_detail", direction: 1, weight: 3, context: "technical", nodeId: "software-review", decisionId: "test", difficulty: 3 },
    ]);

    expect(result.compatibility).toHaveLength(15);
    expect(result.compatibility.map(item => item.careerName)).toContain("Software Engineer");
    expect(result.compatibility.map(item => item.careerName)).toContain("Doctor / Physician");
    expect(result.compatibility[0]?.careerName).not.toBe("Doctor / Physician");
  });
});
