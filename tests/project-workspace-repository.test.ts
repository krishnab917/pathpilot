import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as any }));

vi.mock("../server/supabase", () => ({
  currentSupabaseClient: () => mocks.client,
  getSupabaseConfig: () => ({ url: "https://example.supabase.co" }),
}));

import { createProjectWorkspaceMilestone, deleteProjectWorkspaceMilestone, updateProject } from "../server/db";

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const milestoneId = "33333333-3333-4333-8333-333333333333";

function chain(result: unknown) {
  const value = { select: vi.fn(), eq: vi.fn(), update: vi.fn(), insert: vi.fn(), delete: vi.fn(), maybeSingle: vi.fn(), single: vi.fn() };
  value.select.mockReturnValue(value); value.eq.mockReturnValue(value); value.update.mockReturnValue(value); value.insert.mockReturnValue(value); value.delete.mockReturnValue(value); value.maybeSingle.mockResolvedValue(result); value.single.mockResolvedValue(result);
  return value;
}

describe("project workspace repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates editable project workspace fields only through the owner-scoped project record", async () => {
    const project = chain({ data: { id: projectId, user_id: userId, name: "Research dashboard", description: "A student research tracker.", scope_statement: "Track observations; exclude personal health data.", project_notes: "Need to validate source data.", skills: ["TypeScript", "SQL"], github_link: null, live_url: null, status: "in_progress", progress: 30, start_date: null, completion_date: null, career_id: null, roadmap_milestone_id: null, project_goals: [], project_milestones: [], created_at: "2026-08-17T00:00:00Z", updated_at: "2026-08-17T00:00:00Z" }, error: null });
    mocks.client = { from: vi.fn(() => project) };

    await expect(updateProject(userId, projectId, { scopeStatement: "Track observations; exclude personal health data.", skills: ["TypeScript", "SQL"] })).resolves.toMatchObject({ id: projectId, scopeStatement: "Track observations; exclude personal health data.", skills: ["TypeScript", "SQL"] });
    expect(project.update).toHaveBeenCalledWith(expect.objectContaining({ scope_statement: "Track observations; exclude personal health data.", skills: ["TypeScript", "SQL"] }));
    expect(project.eq).toHaveBeenNthCalledWith(1, "id", projectId);
    expect(project.eq).toHaveBeenNthCalledWith(2, "user_id", userId);
  });

  it("requires project ownership before creating a student-owned project milestone", async () => {
    const ownedProject = chain({ data: { id: projectId }, error: null });
    const milestone = chain({ data: { id: milestoneId, project_id: projectId, user_id: userId, title: "Sketch the data model", details: null, status: "not_started", progress: 0, target_date: null, sort_order: 0, created_at: "2026-08-17T00:00:00Z", updated_at: "2026-08-17T00:00:00Z" }, error: null });
    mocks.client = { from: vi.fn((table: string) => table === "projects" ? ownedProject : milestone) };

    await expect(createProjectWorkspaceMilestone(userId, projectId, { title: "Sketch the data model" })).resolves.toMatchObject({ id: milestoneId, projectId, userId, status: "not_started" });
    expect(ownedProject.eq).toHaveBeenNthCalledWith(1, "id", projectId);
    expect(ownedProject.eq).toHaveBeenNthCalledWith(2, "user_id", userId);
    expect(milestone.insert).toHaveBeenCalledWith(expect.objectContaining({ project_id: projectId, user_id: userId, title: "Sketch the data model" }));
  });

  it("deletes a milestone only when project and student ownership both match", async () => {
    const milestone = chain({ data: { id: milestoneId }, error: null });
    mocks.client = { from: vi.fn(() => milestone) };

    await expect(deleteProjectWorkspaceMilestone(userId, projectId, milestoneId)).resolves.toEqual({ id: milestoneId, deleted: true });
    expect(milestone.eq).toHaveBeenNthCalledWith(1, "id", milestoneId);
    expect(milestone.eq).toHaveBeenNthCalledWith(2, "project_id", projectId);
    expect(milestone.eq).toHaveBeenNthCalledWith(3, "user_id", userId);
  });
});
