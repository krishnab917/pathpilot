export type WorkspaceDataSection = "overview" | "discover" | "roadmap" | "simulate" | "portfolio" | "mentor" | "goals";

export function requiresWorkspaceDashboard(section: WorkspaceDataSection) {
  return section !== "portfolio" && section !== "mentor";
}
