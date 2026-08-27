import { trpc } from "@/lib/trpc";

type PathpilotUtils = ReturnType<typeof trpc.useUtils>;

export function invalidatePlanningSummaries(utils: PathpilotUtils) {
  return Promise.all([
    utils.pathpilot.dashboard.get.invalidate(),
    utils.pathpilot.review.get.invalidate(),
  ]);
}

export function invalidatePlanningActivity(utils: PathpilotUtils) {
  return utils.pathpilot.activity.list.invalidate();
}

export function invalidatePlanningSummariesAndActivity(utils: PathpilotUtils) {
  return Promise.all([
    invalidatePlanningSummaries(utils),
    invalidatePlanningActivity(utils),
  ]);
}

export function invalidateCareerDirectionDependentViews(utils: PathpilotUtils) {
  return Promise.all([
    utils.pathpilot.dashboard.get.invalidate(),
    utils.pathpilot.opportunities.list.invalidate(),
  ]);
}

export function invalidateProfileDependentViews(utils: PathpilotUtils) {
  return Promise.all([
    utils.pathpilot.profile.get.invalidate(),
    utils.pathpilot.dashboard.get.invalidate(),
    utils.pathpilot.opportunities.list.invalidate(),
  ]);
}

export function invalidateProjectDependentViews(utils: PathpilotUtils) {
  return Promise.all([
    utils.pathpilot.projects.list.invalidate(),
    invalidatePlanningSummaries(utils),
    invalidatePlanningActivity(utils),
  ]);
}
