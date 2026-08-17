import { describe, expect, it } from "vitest";
import { buildBehaviorEvolution } from "../server/simulation/evolution";

const profile = (trait: any, score: number) => ({ traits: [{ trait, score, confidence: "moderate", evidenceCount: 2, contexts: ["planning"] }], patterns: [], contradictions: [], contextObservations: [], strongestTraits: [trait], developmentTraits: [] });

describe("cross-simulation behavior evolution", () => {
  it("weights newer completed simulations more heavily while keeping the method explicit", () => {
    const evolution = buildBehaviorEvolution([{ id: "new", career: "UX Designer", completedAt: new Date("2026-08-15"), behavioralProfile: profile("communication", 90) }, { id: "old", career: "UX Designer", completedAt: new Date("2026-08-01"), behavioralProfile: profile("communication", 40) }]);
    expect(evolution?.traits[0]).toMatchObject({ trait: "communication", score: 67, observations: 2, consistency: "varied", confidence: "building", trend: "varied" });
    expect(evolution?.mostRecentCompletedAt).toEqual(new Date("2026-08-15"));
    expect(evolution?.method).toContain("1.00");
  });

  it("caps synthesis to five recent simulations and treats one simulation as an initial signal", () => {
    const samples = Array.from({ length: 7 }, (_, index) => ({ id: String(index), career: "Software Engineer", completedAt: new Date(2026, 0, index + 1), behavioralProfile: profile("problem_solving", 60) }));
    expect(buildBehaviorEvolution(samples)?.includedSimulationCount).toBe(5);
    expect(buildBehaviorEvolution([samples[0]])?.evolvingFocus?.rationale).toContain("initial signal");
  });

  it("uses only simulation observation coverage to describe confidence and trend", () => {
    const evolution = buildBehaviorEvolution([
      { id: "new", career: "Research Scientist", completedAt: new Date("2026-08-15"), behavioralProfile: profile("analytical_thinking", 76) },
      { id: "old", career: "Research Scientist", completedAt: new Date("2026-08-01"), behavioralProfile: profile("analytical_thinking", 68) },
      { id: "older", career: "Research Scientist", completedAt: new Date("2026-07-01"), behavioralProfile: profile("analytical_thinking", 67) },
    ]);
    expect(evolution?.traits[0]).toMatchObject({ observations: 3, confidence: "repeated", trend: "similar" });
    expect(JSON.stringify(evolution)).not.toContain("responseTime");
    expect(JSON.stringify(evolution)).not.toContain("decisionHistory");
    expect(evolution?.method).toContain("not a personality, ability, motivation, or career prediction");
  });
});
