import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as any }));

vi.mock("../server/supabase", () => ({
  currentSupabaseClient: () => mocks.client,
  getSupabaseConfig: () => ({ url: "https://example.supabase.co" }),
}));

import { createProjectFromRoadmapMilestone } from "../server/db";

const userId = "11111111-1111-4111-8111-111111111111";
const milestoneId = "22222222-2222-4222-8222-222222222222";

function query(result: { data: unknown; error: null }) {
  const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(result);
  return chain;
}

describe("createProjectFromRoadmapMilestone", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries a milestone through its owning roadmap and returns an existing owned project without creating a duplicate", async () => {
    const milestone = query({ data: { id: milestoneId, category: "project", title: "Build a small prototype", description: "Create a focused prototype that demonstrates a relevant skill.", roadmaps: { user_id: userId, target_career: "Software engineer" } }, error: null });
    const existing = query({ data: { id: "33333333-3333-4333-8333-333333333333" }, error: null });
    mocks.client = { from: vi.fn((table: string) => table === "roadmap_milestones" ? milestone : existing) };

    await expect(createProjectFromRoadmapMilestone(userId, milestoneId)).resolves.toEqual({ projectId: "33333333-3333-4333-8333-333333333333", created: false });
    expect(milestone.eq).toHaveBeenNthCalledWith(1, "id", milestoneId);
    expect(milestone.eq).toHaveBeenNthCalledWith(2, "roadmaps.user_id", userId);
    expect(existing.eq).toHaveBeenNthCalledWith(1, "user_id", userId);
    expect(existing.eq).toHaveBeenNthCalledWith(2, "roadmap_milestone_id", milestoneId);
  });

  it("rejects non-project milestones before checking or creating a project", async () => {
    const milestone = query({ data: { id: milestoneId, category: "skill", title: "Practice a core skill", roadmaps: { user_id: userId, target_career: "Software engineer" } }, error: null });
    const from = vi.fn(() => milestone);
    mocks.client = { from };

    await expect(createProjectFromRoadmapMilestone(userId, milestoneId)).rejects.toThrow("Only project milestones can start a project workspace.");
    expect(from).toHaveBeenCalledTimes(1);
  });
});
