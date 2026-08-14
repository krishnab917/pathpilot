import { describe, expect, it } from "vitest";
import { shouldShowWorkspaceStartupFrame } from "../client/src/lib/workspace-startup";

describe("shouldShowWorkspaceStartupFrame", () => {
  it("keeps the workspace shell visible while auth state is restoring", () => {
    expect(shouldShowWorkspaceStartupFrame({ authLoading: true, isAuthenticated: false, dashboardLoading: false })).toBe(true);
  });

  it("keeps the workspace shell visible while authenticated dashboard data loads", () => {
    expect(shouldShowWorkspaceStartupFrame({ authLoading: false, isAuthenticated: true, dashboardLoading: true })).toBe(true);
  });

  it("does not mask the signed-out or ready workspace states", () => {
    expect(shouldShowWorkspaceStartupFrame({ authLoading: false, isAuthenticated: false, dashboardLoading: true })).toBe(false);
    expect(shouldShowWorkspaceStartupFrame({ authLoading: false, isAuthenticated: true, dashboardLoading: false })).toBe(false);
  });
});
