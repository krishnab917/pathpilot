import { describe, expect, it } from "vitest";
import { workspaceLoadingLabel } from "../client/src/lib/workspace-skeleton";

describe("workspace skeleton labels", () => {
  it("assigns a meaningful loading label to every workspace section", () => {
    expect(workspaceLoadingLabel("overview")).toBe("Loading workspace overview");
    expect(workspaceLoadingLabel("roadmap")).toBe("Loading roadmap");
    expect(workspaceLoadingLabel("simulate")).toBe("Restoring simulation");
    expect(workspaceLoadingLabel("mentor")).toBe("Loading career mentor");
  });
});
