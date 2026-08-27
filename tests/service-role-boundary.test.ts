import { validateCareerCatalogWrite, type CareerRecommendation } from "../server/db";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const validRecommendation = (name: string): CareerRecommendation => ({
  name, description: "A valid career description designed for server-side boundary validation.", salaryRange: "Location dependent", educationRequirements: "A valid education requirement description for high-school planning.", requiredSkills: ["Skill one", "Skill two", "Skill three"], dailyResponsibilities: ["Responsibility one", "Responsibility two"], relatedCareers: ["Related one", "Related two"], matchScore: 80, reasoning: "A sufficiently detailed and validated explanation connects the recommendation to the student profile.", strengths: ["Strength"], missingSkills: ["Growth area"], realityCheck: "A sufficiently detailed, grounded caution explains that outcomes depend on sustained exploration and local conditions.", nextSteps: ["Explore the work", "Interview a professional"],
});

describe("service-role career catalog boundary", () => {
  it("requires a valid user identifier, five unique records, and bounded score data before catalog persistence", () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const matches = ["Software Engineer", "AI / Machine Learning Engineer", "Doctor / Physician", "Lawyer", "Entrepreneur / Startup Founder"].map(validRecommendation);
    expect(() => validateCareerCatalogWrite(userId, matches)).not.toThrow();
    expect(() => validateCareerCatalogWrite("not-a-user", matches)).toThrow("authenticated user");
    expect(() => validateCareerCatalogWrite(userId, matches.slice(0, 4))).toThrow("exactly five");
    expect(() => validateCareerCatalogWrite(userId, [...matches.slice(0, 4), validRecommendation("Software Engineer")])).toThrow("supported PathPilot careers");
    expect(() => validateCareerCatalogWrite(userId, [...matches.slice(0, 4), validRecommendation("Registered Nurse")])).toThrow("supported PathPilot careers");
  });

  it("keeps the service-role credential out of browser modules and requires it explicitly for every privileged path", () => {
    const clientSource = ["client/src/lib/supabase.ts", "client/src/pages/Auth.tsx", "client/src/main.tsx"].map(path => readFileSync(resolve(process.cwd(), path), "utf8")).join("\n");
    const repositorySource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const workerSource = readFileSync(resolve(process.cwd(), "server/derived-analysis.ts"), "utf8");
    expect(clientSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(repositorySource).toContain("const key = process.env.SUPABASE_SERVICE_ROLE_KEY;");
    expect(repositorySource).not.toContain("SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY");
    expect(workerSource).toContain("const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;");
    expect(workerSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY");
  });

  it("does not reference privileged server credentials anywhere in browser source", () => {
    const clientDirectory = resolve(process.cwd(), "client/src");
    const collectSource = (directory: string): string[] =>
      readdirSync(directory).flatMap(entry => {
        const path = resolve(directory, entry);
        return statSync(path).isDirectory()
          ? collectSource(path)
          : /\.(?:ts|tsx)$/.test(entry)
            ? [path]
            : [];
      });
    const clientSource = collectSource(clientDirectory)
      .map(path => readFileSync(path, "utf8"))
      .join("\n");

    for (const prohibitedIdentifier of [
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SECRET_KEY",
      "BUILT_IN_FORGE_API_KEY",
      "JWT_SECRET",
      "DATABASE_URL",
      "AWS_SECRET_ACCESS_KEY",
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
    ]) {
      expect(clientSource).not.toContain(prohibitedIdentifier);
    }
  });
});
