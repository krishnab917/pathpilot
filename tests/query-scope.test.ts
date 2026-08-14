import { describe, expect, it } from "vitest";
import { pathpilotQueryDefaults } from "../client/src/lib/query-defaults";
import { requiresWorkspaceDashboard } from "../client/src/lib/workspace-data-scope";

describe("PathPilot query defaults", () => {
  it("keeps stable workspace data fresh for a bounded interval without focus refetches", () => {
    expect(pathpilotQueryDefaults.queries.staleTime).toBe(60_000);
    expect(pathpilotQueryDefaults.queries.refetchOnWindowFocus).toBe(false);
    expect(pathpilotQueryDefaults.queries.retry).toBe(1);
  });
});

describe("workspace data scope", () => {
  it("keeps the aggregate dashboard query off the portfolio and mentor routes", () => {
    expect(requiresWorkspaceDashboard("portfolio")).toBe(false);
    expect(requiresWorkspaceDashboard("mentor")).toBe(false);
  });

  it("retains aggregate data for sections that render dashboard-derived content", () => {
    expect(requiresWorkspaceDashboard("overview")).toBe(true);
    expect(requiresWorkspaceDashboard("roadmap")).toBe(true);
    expect(requiresWorkspaceDashboard("simulate")).toBe(true);
  });
});
