import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Workspace.tsx"),
  "utf8"
);

describe("workspace section loading", () => {
  it("defers heavyweight workspace modules until their sections are opened", () => {
    expect(workspaceSource).toContain(
      'import("@/components/AdaptiveSimulation").then(module => ({'
    );
    expect(workspaceSource).toContain(
      'import("@/components/RoadmapExperience").then(module => ({'
    );
    expect(workspaceSource).toContain(
      'const Portfolio = lazy(() => import("./Portfolio"));'
    );
    expect(workspaceSource).toContain(
      'const Opportunities = lazy(() => import("./Opportunities"));'
    );
    expect(workspaceSource).toContain(
      '<Suspense fallback={<WorkspaceSectionSkeleton section="portfolio" />}>'
    );
    expect(workspaceSource).toContain(
      '<Suspense fallback={<WorkspaceSectionSkeleton section="opportunities" />}>'
    );
    expect(workspaceSource).toContain(
      '<Suspense fallback={<WorkspaceSectionSkeleton section="roadmap" />}>'
    );
    expect(workspaceSource).toContain(
      '<Suspense fallback={<WorkspaceSectionSkeleton section="simulate" />}>'
    );
  });
});
