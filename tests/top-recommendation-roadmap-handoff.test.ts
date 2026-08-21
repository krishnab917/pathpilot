import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/RoadmapExperience.tsx"), "utf8");

describe("top recommendation roadmap handoff", () => {
  it("sorts preliminary evidence by score before selecting the fresh roadmap target", () => {
    expect(source).toContain("sort((left: any, right: any) => right.score - left.score)[0]");
    expect(source).toContain("topPreliminaryFit?.careerName ?? handoffContext.data?.simulation?.career");
    expect(source).toContain("roadmap?.targetCareer ?? (simulationId ? topRecommendedCareer");
  });

  it("uses a supported-career selector and preserves student agency before roadmap creation", () => {
    expect(source).toContain("trpc.pathpilot.simulations.adaptive.catalog.useQuery");
    expect(source).toContain("Recommended roadmap starting point");
    expect(source).toContain("Roadmap career<select");
    expect(source).toContain("Choose a supported career");
    expect(source).toContain("You can choose another supported career before creating a roadmap");
  });

  it("keeps recommendation provenance explicitly preliminary and non-predictive", () => {
    expect(source).toContain("highest preliminary evidence fit");
    expect(source).toContain("not a prediction or final recommendation");
    expect(source).toContain("does not change the completed simulation or its preliminary evidence");
  });
});
