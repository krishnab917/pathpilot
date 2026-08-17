import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: () => mocks.client, getSupabaseConfig: () => ({ url: "https://example.supabase.co" }) }));

import { clearPlanningActivity, exportPlanningActivity, listPlanningActivity, updateProject } from "../server/db";

describe("planning activity repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads a bounded activity projection only for the authenticated student", async () => {
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn() };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query); query.limit.mockResolvedValue({ data: [{ id: "11111111-1111-4111-8111-111111111111", event_type: "goal_completed", subject_type: "goal", created_at: "2026-08-17T00:00:00Z", metadata: { ignored: true } }], error: null });
    mocks.client = { from: vi.fn(() => query) };

    const result = await listPlanningActivity("22222222-2222-4222-8222-222222222222");
    expect(query.select).toHaveBeenCalledWith("id, event_type, subject_type, created_at");
    expect(query.eq).toHaveBeenCalledWith("user_id", "22222222-2222-4222-8222-222222222222");
    expect(query.limit).toHaveBeenCalledWith(12);
    expect(result).toMatchObject([{ title: "Completed a goal", detail: "You marked a commitment complete." }]);
    expect(JSON.stringify(result)).not.toContain("ignored");
  });

  it("clears only the authenticated student’s activity rows", async () => {
    const command = { delete: vi.fn(), eq: vi.fn() };
    command.delete.mockReturnValue(command); command.eq.mockResolvedValue({ error: null });
    mocks.client = { from: vi.fn(() => command) };

    await expect(clearPlanningActivity("33333333-3333-4333-8333-333333333333")).resolves.toEqual({ cleared: true });
    expect(mocks.client.from).toHaveBeenCalledWith("behavioral_activity_events");
    expect(command.eq).toHaveBeenCalledWith("user_id", "33333333-3333-4333-8333-333333333333");
  });

  it("exports a bounded neutral projection only for the authenticated student", async () => {
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn() };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query); query.limit.mockResolvedValue({ data: [{ event_type: "project_completed", subject_type: "project", created_at: "2026-08-17T00:00:00Z", metadata: { ignored: true } }], error: null });
    mocks.client = { from: vi.fn(() => query) };

    const result = await exportPlanningActivity("33333333-3333-4333-8333-333333333333");
    expect(query.select).toHaveBeenCalledWith("event_type, subject_type, created_at");
    expect(query.eq).toHaveBeenCalledWith("user_id", "33333333-3333-4333-8333-333333333333");
    expect(query.limit).toHaveBeenCalledWith(100);
    expect(result).toMatchObject([{ activity: "Completed a project", subject: "project" }]);
    expect(JSON.stringify(result)).not.toContain("ignored");
  });

  it("records a bounded project progress event only after the owner-scoped project update succeeds", async () => {
    const project = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    project.update.mockReturnValue(project); project.eq.mockReturnValue(project); project.select.mockReturnValue(project); project.maybeSingle.mockResolvedValue({ data: { id: "44444444-4444-4444-8444-444444444444", user_id: "33333333-3333-4333-8333-333333333333", progress: 60, status: "in_progress" }, error: null });
    const activity = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mocks.client = { from: vi.fn((table: string) => table === "projects" ? project : activity) };

    await expect(updateProject("33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444", { progress: 60 })).resolves.toMatchObject({ progress: 60 });
    expect(project.eq).toHaveBeenCalledWith("user_id", "33333333-3333-4333-8333-333333333333");
    expect(activity.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "33333333-3333-4333-8333-333333333333", event_type: "project_progress_updated", subject_type: "project", subject_id: "44444444-4444-4444-8444-444444444444", metadata: { progress: 60 } }));
  });
});
