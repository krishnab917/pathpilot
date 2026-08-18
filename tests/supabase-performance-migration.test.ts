import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260818_checkpoint39_security_performance.sql"
);
const migration = readFileSync(migrationPath, "utf8");
const portfolioMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260818_checkpoint39_portfolio_policy_optimization.sql"
  ),
  "utf8"
);

describe("Checkpoint 39 Supabase performance migration", () => {
  it("adds every foreign-key index identified by the live audit without dropping records or constraints", () => {
    expect((migration.match(/create index if not exists/g) ?? [])).toHaveLength(17);
    expect(migration).toContain("ai_messages_conversation_id_idx");
    expect(migration).toContain("roadmap_recommendations_roadmap_id_idx");
    expect(migration).toContain("student_opportunity_states_opportunity_id_idx");
    expect(migration).not.toMatch(/\bdrop\s+(table|index|policy|constraint)\b/i);
  });

  it("keeps owner-scoped policies while evaluating auth.uid once per policy execution plan", () => {
    expect(migration).toContain('alter policy "student_profile_owner"');
    expect(migration).toContain('alter policy "portfolio_project_owner"');
    expect(migration).toContain("(select auth.uid()) = user_id");
    expect(migration).toContain("projects.user_id = (select auth.uid())");
    expect(migration).toContain("roadmaps.user_id = (select auth.uid())");
  });

  it("merges overlapping portfolio reads without broadening publication or mutation access", () => {
    expect(portfolioMigration).toContain('create policy "portfolio_profile_select"');
    expect(portfolioMigration).toContain('create policy "portfolio_project_select"');
    expect(portfolioMigration).toContain("is_published = true");
    expect(portfolioMigration).toContain("for insert to authenticated");
    expect(portfolioMigration).toContain("for update to authenticated");
    expect(portfolioMigration).toContain("for delete to authenticated");
  });
});
