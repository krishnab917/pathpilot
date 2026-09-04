export type WorkspaceSkeletonSection =
  | "overview"
  | "discover"
  | "roadmap"
  | "simulate"
  | "portfolio"
  | "opportunities"
  | "mentor"
  | "goals"
  | "settings";

const loadingLabels: Record<WorkspaceSkeletonSection, string> = {
  overview: "Loading workspace overview",
  discover: "Loading career discovery",
  roadmap: "Loading roadmap",
  simulate: "Restoring simulation",
  portfolio: "Loading project portfolio",
  opportunities: "Loading verified opportunities",
  mentor: "Loading career mentor",
  goals: "Loading commitments",
  settings: "Loading settings",
};

export function workspaceLoadingLabel(section: WorkspaceSkeletonSection) {
  return loadingLabels[section];
}
