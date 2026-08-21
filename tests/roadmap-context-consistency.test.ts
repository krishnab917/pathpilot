import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildRoadmapContextLabels } from "../client/src/lib/roadmap-context";
import { requiresRoadmapCareerChangeConfirmation } from "../server/roadmap/career-change";

const roadmapSource = readFileSync(resolve(process.cwd(), "client/src/components/RoadmapExperience.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers/pathpilot.ts"), "utf8");

describe("roadmap context consistency", () => {
  it("keeps the active roadmap career distinct when the latest simulated environment differs", () => {
    const labels = buildRoadmapContextLabels({
      roadmapCareer: "Software Engineer",
      simulationCareer: "Entrepreneur / Startup Founder",
      preliminaryFit: { careerName: "Software Engineer", score: 91 },
      includedSimulationCount: 5,
      completedSimulationCount: 5,
    });
    expect(labels.roadmapCareer).toBe("Software Engineer");
    expect(labels.simulationCareer).toBe("Entrepreneur / Startup Founder");
    expect(labels.fit).toEqual({ careerName: "Software Engineer", score: 91 });
    expect(labels.relationship).toContain("remains focused on Software Engineer");
    expect(labels.recommendationTitle).toContain("Entrepreneur / Startup Founder");
    expect(labels.recommendationSource).toContain("current roadmap remains Software Engineer");
  });

  it("allows a preliminary fit to differ from the current roadmap and the simulated career", () => {
    const labels = buildRoadmapContextLabels({
      roadmapCareer: "Software Engineer",
      simulationCareer: "Doctor / Physician",
      preliminaryFit: { careerName: "Research Scientist", score: 86 },
      includedSimulationCount: 2,
      completedSimulationCount: 5,
    });
    expect(labels.fit?.careerName).toBe("Research Scientist");
    expect(labels.relationship).toContain("latest simulation explored Doctor / Physician");
    expect(labels.recommendationTitle).toBe("Explore based on your latest Doctor / Physician");
  });

  it("allows a preliminary fit to match the simulated career without replacing the active roadmap", () => {
    const labels = buildRoadmapContextLabels({
      roadmapCareer: "Software Engineer",
      simulationCareer: "Entrepreneur / Startup Founder",
      preliminaryFit: { careerName: "Entrepreneur / Startup Founder", score: 86 },
      includedSimulationCount: 1,
      completedSimulationCount: 1,
    });
    expect(labels.fit?.careerName).toBe("Entrepreneur / Startup Founder");
    expect(labels.roadmapCareer).toBe("Software Engineer");
    expect(labels.relationship).toContain("current roadmap remains Software Engineer");
  });

  it("uses an evidence-safe missing-fit state and one internally consistent coverage statement", () => {
    const labels = buildRoadmapContextLabels({
      roadmapCareer: "Software Engineer",
      simulationCareer: "Doctor / Physician",
      preliminaryFit: null,
      includedSimulationCount: 5,
      completedSimulationCount: 5,
    });
    expect(labels.fit).toBeNull();
    expect(labels.coverage).toBe("Coverage: 5 of 5 completed simulations. More recent simulations contribute more heavily to this summary.");
    expect(roadmapSource).toContain("Not enough evidence yet");
    expect(roadmapSource).not.toContain('source?.careerCompatibilityScore ?? "—"');
  });

  it("makes persisted country impact and unchanged student-owned records explicit", () => {
    expect(roadmapSource).toContain("Changing your country affects future roadmap and opportunity recommendations. Existing saved goals remain unchanged until you explicitly refresh them.");
    expect(roadmapSource).toContain("Existing saved goals, projects, accepted recommendations, and roadmap milestones remain unchanged unless you choose an action below.");
  });

  it("requires explicit confirmation before a different active roadmap career can be replaced", () => {
    expect(requiresRoadmapCareerChangeConfirmation("Software Engineer", "Doctor / Physician")).toBe(true);
    expect(requiresRoadmapCareerChangeConfirmation("Software Engineer", " software   engineer ")).toBe(false);
    expect(requiresRoadmapCareerChangeConfirmation(undefined, "Doctor / Physician")).toBe(false);
    expect(routerSource).toContain("confirmCareerChange");
    expect(routerSource).toContain("requires your explicit confirmation");
    expect(roadmapSource).toContain("Change roadmap career");
    expect(roadmapSource).toContain("archive that active roadmap");
  });
});
