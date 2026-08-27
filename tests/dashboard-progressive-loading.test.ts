import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DASHBOARD_SECONDARY_DELAY_MS, deferredDashboardQueryOptions } from "../client/src/lib/dashboard-secondary";

const workspaceSource = readFileSync(resolve(process.cwd(), "client/src/pages/Workspace.tsx"), "utf8");

describe("dashboard progressive-loading contract", () => {
  it("keeps critical dashboard rendering independent of secondary review, activity, and behavior queries", () => {
    expect(DASHBOARD_SECONDARY_DELAY_MS).toBe(50);
    expect(workspaceSource).toContain("const [loadSecondary, setLoadSecondary] = useState(false)");
    expect(workspaceSource).toContain("<PlanningReview onNavigate={onNavigate} enabled={loadSecondary} />");
    expect(workspaceSource).toContain("<PlanningActivityTimeline enabled={loadSecondary} />");
  });

  it("does not begin lower-priority dashboard queries until after the shell is rendered and cancels them on unmount", () => {
    expect(workspaceSource).toContain("() => setLoadSecondary(true)");
    expect(workspaceSource).toContain("enabled: enabled && hasCompletedSimulation");
    expect(workspaceSource).toContain("enabled,");
    expect(deferredDashboardQueryOptions.trpc.abortOnUnmount).toBe(true);
  });
});
