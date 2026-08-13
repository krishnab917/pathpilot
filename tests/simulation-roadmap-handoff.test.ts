import { describe, expect, it } from "vitest";
import { roadmapPathForSimulation, simulationIdFromRoadmapSearch } from "../client/src/lib/simulation-roadmap-handoff";

const simulationId = "41a9b4c1-90dc-4f23-80bc-7b133c08fa86";

describe("simulation-to-roadmap handoff", () => {
  it("routes a completed simulation directly to the roadmap with its owned identifier", () => {
    expect(roadmapPathForSimulation(simulationId)).toBe(`/app/roadmap?simulation=${simulationId}`);
  });

  it("restores only a valid simulation identifier from the roadmap query string", () => {
    expect(simulationIdFromRoadmapSearch(`?simulation=${simulationId}`)).toBe(simulationId);
    expect(simulationIdFromRoadmapSearch("?simulation=not-a-uuid")).toBeUndefined();
    expect(simulationIdFromRoadmapSearch("")).toBeUndefined();
  });
});
