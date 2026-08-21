import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCountryAwareRecommendations } from "../server/roadmap/recommendations";
import { simulationCareerCatalog } from "../server/simulation/catalog";

const roadmapExperience = readFileSync(resolve(process.cwd(), "client/src/components/RoadmapExperience.tsx"), "utf8");

describe("fresh completed simulation recommendations", () => {
  it("produces visible Environmental Scientist actions before a student has an active roadmap", () => {
    const actions = buildCountryAwareRecommendations({
      career: "Environmental Scientist", countryCode: "US", grade: "Grade 10", skills: [], activities: [], existingTitles: [], strongestTraits: ["systems_thinking"],
    });
    expect(actions).toHaveLength(4);
    expect(actions.filter(action => action.intelligence?.kind === "primary")).toHaveLength(3);
    expect(actions.map(action => action.intelligence?.requirementId)).toEqual(expect.arrayContaining(["environmental-science-foundation", "environmental-data-evidence", "environmental-community-application"]));
  });

  it("renders the recommendation context from a completed simulation instead of incorrectly requiring an active roadmap", () => {
    expect(roadmapExperience).toContain("{simulationId && <RoadmapContextForSimulation simulationId={simulationId} roadmap={roadmap} />}");
    expect(roadmapExperience).not.toContain("{roadmap && <RoadmapContextForSimulation simulationId={simulationId} roadmap={roadmap} />}");
  });

  it("supplies a first-time primary recommendation queue for every supported completed simulation without an active roadmap", () => {
    for (const career of simulationCareerCatalog) {
      const actions = buildCountryAwareRecommendations({
        career: career.name, countryCode: "US", grade: "Grade 10", skills: [], activities: [], existingTitles: [], strongestTraits: [],
      });
      expect(actions, career.name).toHaveLength(4);
      expect(actions.filter(action => action.phase === "Do this next"), career.name).toHaveLength(3);
      expect(actions[0]?.rationale, career.name).toContain(`targeting ${career.name}`);
      expect(actions.every(action => action.intelligence?.requirementId && action.intelligence.studentGap && action.intelligence.tip), career.name).toBe(true);
    }
  });
});
