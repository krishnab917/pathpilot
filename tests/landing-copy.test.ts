import { describe, expect, it } from "vitest";
import {
  landingCopy,
  landingAudiences,
  landingJourneySteps,
  landingQuestions,
} from "../client/src/lib/landing-copy";
import {
  landingCareerExamples,
  landingSimulationExcerpt,
} from "../client/src/lib/landing-product-examples";
import { simulationCareerCatalog } from "../server/simulation/catalog";
import { softwareV1Graph } from "../server/simulation/graphs/software-v1";

describe("landing-page narrative", () => {
  it("keeps the core message and all three audience paths", () => {
    expect(landingCopy.hero.titleLead).toBe("Discover your career.");
    expect(landingCopy.hero.titleAccent).toBe("Build the path to reach it.");
    expect(landingAudiences.map(item => item.id)).toEqual([
      "students",
      "parents",
      "educators",
    ]);
    expect(landingAudiences.map(item => item.href)).toEqual([
      "/auth",
      "/parents",
      "/schools",
    ]);
    for (const audience of landingAudiences) {
      expect(audience.story).toMatch(/^Imagine/);
      expect(audience.points).toHaveLength(3);
    }
  });
  it("covers the full six-step journey and natural objections", () => {
    expect(landingJourneySteps.map(item => item.id)).toEqual([
      "discover",
      "explore",
      "experience",
      "roadmap",
      "opportunities",
      "continue",
    ]);
    expect(landingQuestions).toHaveLength(5);
    const copy = JSON.stringify({
      landingCopy,
      landingAudiences,
      landingQuestions,
    }).toLowerCase();
    for (const claim of [
      "guaranteed success",
      "ferpa compliant",
      "revolutionize",
      "unlock your potential",
      "improve your grades",
    ])
      expect(copy).not.toContain(claim);
    expect(copy).toContain("at your own pace");
    expect(copy).toContain("not a measure of your ability");
  });
  it("uses actual public career catalog descriptions", () => {
    for (const example of landingCareerExamples) {
      const actual = simulationCareerCatalog.find(
        item => item.id === example.id
      );
      expect(actual).toMatchObject(example);
      expect(Object.keys(example).sort()).toEqual(
        [
          "category",
          "description",
          "durationLabel",
          "icon",
          "id",
          "name",
          "simulationIntro",
        ].sort()
      );
    }
  });
  it("uses the exact opening scenario without publishing hidden scoring", () => {
    const opening = softwareV1Graph.nodes[softwareV1Graph.startNodeId];
    expect(landingSimulationExcerpt).toEqual({
      title: opening.title,
      situation: opening.situation,
      choices: opening.decisions.map(item => item.label),
    });
    expect(JSON.stringify(landingSimulationExcerpt)).not.toContain("signals");
  });
});
