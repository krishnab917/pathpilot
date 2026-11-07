import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { requiresWorkspaceDashboard } from "../client/src/lib/workspace-data-scope";

describe("direct Settings route data boundary", () => {
  it("does not request the unrelated dashboard payload", () => {
    expect(requiresWorkspaceDashboard("settings")).toBe(false);
  });
  it("renders Settings before the dashboard-data gate", () => {
    // Source contract complements the real signed-in direct-navigation browser
    // reproduction. This is not a substitute for authenticated browser testing.
    const source = readFileSync(new URL("../client/src/pages/Workspace.tsx", import.meta.url), "utf8");
    const content = source.slice(source.indexOf("const content ="), source.indexOf("const sidebar ="));
    expect(content).toMatch(/section === "settings"\s*\?\s*\(\s*<SettingsView\s*\/>\s*\)\s*:\s*dashboard\.data/);
    expect(content).not.toContain("settings: <SettingsView");
  });
});
