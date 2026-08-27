import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  invalidatePlanningActivity,
  invalidatePlanningSummaries,
  invalidateProfileDependentViews,
  invalidateProjectDependentViews,
} from "../client/src/lib/planning-cache-invalidation";

const utilitySections = readFileSync(resolve(process.cwd(), "client/src/components/UtilityWorkspaceSections.tsx"), "utf8");
const roadmapSource = readFileSync(resolve(process.cwd(), "client/src/components/RoadmapExperience.tsx"), "utf8");
const portfolioSource = readFileSync(resolve(process.cwd(), "client/src/pages/Portfolio.tsx"), "utf8");
const opportunitiesSource = readFileSync(resolve(process.cwd(), "client/src/pages/Opportunities.tsx"), "utf8");
const simulationSource = readFileSync(resolve(process.cwd(), "client/src/components/AdaptiveSimulation.tsx"), "utf8");

function cacheUtils() {
  const invalidate = vi.fn().mockResolvedValue(undefined);
  return {
    invalidate,
    utils: {
      pathpilot: {
        dashboard: { get: { invalidate } },
        review: { get: { invalidate } },
        activity: { list: { invalidate } },
        profile: { get: { invalidate } },
        opportunities: { list: { invalidate } },
        projects: { list: { invalidate } },
      },
    } as any,
  };
}

describe("targeted planning cache invalidation", () => {
  it("refreshes only dashboard and planning review after roadmap-or-goal summary changes", async () => {
    const { invalidate, utils } = cacheUtils();
    await invalidatePlanningSummaries(utils);
    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it("refreshes only activity history when an authoritative action writes activity", async () => {
    const { invalidate, utils } = cacheUtils();
    await invalidatePlanningActivity(utils);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it("refreshes profile-derived dashboard and personalized opportunity views after a profile or country change", async () => {
    const { invalidate, utils } = cacheUtils();
    await invalidateProfileDependentViews(utils);
    expect(invalidate).toHaveBeenCalledTimes(3);
  });

  it("refreshes project-derived planning views without touching unrelated Mentor or recommendation caches", async () => {
    const { invalidate, utils } = cacheUtils();
    await invalidateProjectDependentViews(utils);
    expect(invalidate).toHaveBeenCalledTimes(4);
  });

  it("connects material profile, career, goal, roadmap, and project changes to their smallest affected cache families", () => {
    expect(utilitySections).toContain("invalidateCareerDirectionDependentViews(utils)");
    expect(utilitySections).toContain("invalidatePlanningSummariesAndActivity(utils)");
    expect(roadmapSource).toContain("invalidateProfileDependentViews(utils)");
    expect(roadmapSource).toContain("invalidatePlanningSummaries(utils)");
    expect(roadmapSource).toContain("invalidatePlanningSummariesAndActivity(utils)");
    expect(roadmapSource).toContain("invalidateProjectDependentViews(utils)");
    expect(portfolioSource).toContain("invalidateProjectDependentViews(utils)");
    expect(opportunitiesSource).toContain("invalidatePlanningSummariesAndActivity(utils)");
  });

  it("refreshes behavioral summaries only when an adaptive simulation completes and avoids a redundant dashboard refetch after a Mentor message", () => {
    expect(simulationSource).toContain('if (response.simulation.status === "completed") utils.pathpilot.simulations.adaptive.behaviorSummary.invalidate()');
    expect(utilitySections).toContain("utils.pathpilot.mentor.get.invalidate(); } });");
    expect(utilitySections).not.toContain("utils.pathpilot.mentor.get.invalidate(); utils.pathpilot.dashboard.get.invalidate();");
  });
});
