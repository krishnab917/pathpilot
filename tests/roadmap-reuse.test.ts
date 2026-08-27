import { describe, expect, it } from "vitest";
import { canReuseActiveRoadmap } from "../server/roadmap/reuse";

const at = (milliseconds: number) => new Date(milliseconds);

describe("active roadmap reuse", () => {
  const unchanged = {
    activeRoadmap: { targetCareer: "Data Scientist", updatedAt: at(20) },
    targetCareer: "Data Scientist",
    profileUpdatedAt: at(10),
    goals: [{ updatedAt: at(12) }],
    projects: [{ updatedAt: at(15) }],
  };

  it("reuses only a same-career roadmap at least as new as all generation inputs", () => {
    expect(canReuseActiveRoadmap(unchanged)).toBe(true);
  });

  it("requires a fresh AI generation when a material profile, simulation, goal, or project source is newer", () => {
    expect(canReuseActiveRoadmap({ ...unchanged, profileUpdatedAt: at(21) })).toBe(false);
    expect(canReuseActiveRoadmap({ ...unchanged, latestSimulationUpdatedAt: at(21) })).toBe(false);
    expect(canReuseActiveRoadmap({ ...unchanged, goals: [{ updatedAt: at(21) }] })).toBe(false);
    expect(canReuseActiveRoadmap({ ...unchanged, projects: [{ updatedAt: at(21) }] })).toBe(false);
  });

  it("does not reuse a different career target", () => {
    expect(canReuseActiveRoadmap({ ...unchanged, targetCareer: "Software Engineer" })).toBe(false);
  });
});
