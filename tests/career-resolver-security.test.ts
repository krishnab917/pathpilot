import { describe, expect, it } from "vitest";
import { resolveSupportedCareer, simulationCareerCatalog } from "../server/simulation/catalog";
import { getSimulationGraph } from "../server/simulation/engine";

describe("canonical career resolver security boundary", () => {
  it("resolves exactly the fifteen catalog IDs and canonical names to their own dedicated graph", () => {
    expect(simulationCareerCatalog).toHaveLength(15);
    expect(new Set(simulationCareerCatalog.map(career => career.id)).size).toBe(15);
    for (const career of simulationCareerCatalog) {
      expect(resolveSupportedCareer(career.id)?.id).toBe(career.id);
      expect(resolveSupportedCareer(career.name)?.id).toBe(career.id);
      expect(getSimulationGraph(career.id).id).toBe(career.id === "software-engineer" ? "software-systems-v1" : `${career.id}-v1`);
    }
  });

  it.each([
    "Astronaut",
    "anything",
    "Software Engineer; DROP TABLE simulations;--",
    "",
    "x".repeat(10_000),
    null,
    { career: "Software Engineer" },
  ])("rejects unsupported or malformed career input %# without substitution", input => {
    expect(resolveSupportedCareer(input as any)).toBeNull();
  });
});
