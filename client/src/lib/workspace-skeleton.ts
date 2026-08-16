export type WorkspaceSkeletonSection = "overview" | "discover" | "roadmap" | "simulate" | "portfolio" | "opportunities" | "mentor" | "goals";

const loadingLabels: Record<WorkspaceSkeletonSection, string> = {
  overview: "Loading workspace overview",
  discover: "Loading career discovery",
  roadmap: "Loading roadmap",
  simulate: "Restoring simulation",
  portfolio: "Loading project portfolio",
  opportunities: "Loading verified opportunities",
  mentor: "Loading career mentor",
  goals: "Loading commitments",
};

export function workspaceLoadingLabel(section: WorkspaceSkeletonSection) {
  return loadingLabels[section];
}
