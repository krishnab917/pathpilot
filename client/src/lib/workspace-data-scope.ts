export type WorkspaceDataSection =
  | "overview"
  | "discover"
  | "roadmap"
  | "simulate"
  | "portfolio"
  | "opportunities"
  | "mentor"
  | "goals"
  | "settings";

export function requiresWorkspaceDashboard(section: WorkspaceDataSection) {
  return (
    section !== "portfolio" &&
    section !== "opportunities" &&
    section !== "mentor" &&
    section !== "settings"
  );
}
