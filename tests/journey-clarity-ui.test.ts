import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const discoverySource = readFileSync(
  resolve(process.cwd(), "client/src/components/ReliableProfileAnalysis.tsx"),
  "utf8"
);
const simulationSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AdaptiveSimulation.tsx"),
  "utf8"
);
const roadmapSource = readFileSync(
  resolve(process.cwd(), "client/src/components/RoadmapExperience.tsx"),
  "utf8"
);

describe("journey clarity presentation", () => {
  it("elevates the existing first-ranked discovery match without replacing the five-direction comparison", () => {
    expect(discoverySource).toContain("const recommendedDirection = matches[0]");
    expect(discoverySource).toContain("Recommended direction");
    expect(discoverySource).toContain("Build a roadmap");
    expect(discoverySource).toContain('setLocation("/app/roadmap")');
    expect(discoverySource).toContain("Explore all five directions");
    expect(discoverySource).toContain("matches.map");
    expect(discoverySource).toContain("not a prediction");
  });

  it("clarifies the existing first returned simulation fit while preserving the established roadmap handoff", () => {
    expect(simulationSource).toContain("const recommendedDirection = compatibility[0]");
    expect(simulationSource).toContain("Recommended direction to explore");
    expect(simulationSource).toContain("highest preliminary fit returned by this completed simulation");
    expect(simulationSource).toContain("not a prediction or final recommendation");
    expect(simulationSource).toContain("Build my roadmap");
    expect(simulationSource).toContain("Explore another career");
    expect(simulationSource).toContain("compatibility.slice(0, 5)");
  });

  it("organizes existing pending roadmap cards by stored action kind without altering their controls", () => {
    expect(roadmapSource).toContain("function RecommendationActionMap");
    expect(roadmapSource).toContain("isVisibleInRecommendationQueue(item.status)");
    expect(roadmapSource).toContain('item.actionKind !== "explore"');
    expect(roadmapSource).toContain('item.actionKind === "explore"');
    expect(roadmapSource).toContain("Do this next");
    expect(roadmapSource).toContain("Explore later");
    expect(roadmapSource).toContain("Add, edit, or skip them below.");
    expect(roadmapSource).toContain("<RecommendationQueue simulationId={simulationId} roadmap={roadmap} />");
  });
});
