import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  resolve(process.cwd(), "client/src/components/ReliableProfileAnalysis.tsx"),
  "utf8",
);
const workspaceSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Workspace.tsx"),
  "utf8",
);

describe("Profile Analysis reliability UI", () => {
  it("uses the isolated reliable section in the workspace", () => {
    expect(workspaceSource).toContain('import { ReliableProfileAnalysis } from "@/components/ReliableProfileAnalysis";');
    expect(workspaceSource).toContain("discover: <ReliableProfileAnalysis matches={dashboard.data.matches} />");
  });

  it("shows progressive stages and keeps valid saved analysis visible instead of rerunning it automatically", () => {
    expect(componentSource).toContain('"Checking your profile", "Comparing career directions", "Preparing your matches"');
    expect(componentSource).toContain("matches.length === 5 ? \"complete\" : \"idle\"");
    expect(componentSource).toContain('hasSavedAnalysis ? "Refresh analysis" : "Analyze profile"');
  });

  it("blocks duplicate starts and offers a generic safe retry state without exposing raw mutation errors", () => {
    expect(componentSource).toContain("const inFlight = useRef(false);");
    expect(componentSource).toContain("if (inFlight.current) return;");
    expect(componentSource).toContain("inFlight.current = false;");
    expect(componentSource).toContain("PathPilot couldn’t finish your profile analysis.");
    expect(componentSource).toContain("Try again");
    expect(componentSource).not.toContain("error.message");
  });
});
