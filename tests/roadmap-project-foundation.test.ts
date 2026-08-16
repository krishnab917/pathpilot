import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const mocks = vi.hoisted(() => ({ createProjectFromRoadmapMilestone: vi.fn() }));

vi.mock("../server/db", async importOriginal => {
  const actual = await importOriginal<typeof import("../server/db")>();
  return { ...actual, createProjectFromRoadmapMilestone: mocks.createProjectFromRoadmapMilestone };
});

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const milestoneId = "22222222-2222-4222-8222-222222222222";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("pathpilot.projects.createFromRoadmapMilestone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createProjectFromRoadmapMilestone.mockResolvedValue({ projectId: "33333333-3333-4333-8333-333333333333", created: true });
  });

  it("creates a project only through the signed-in owner context and returns its persisted result", async () => {
    await expect(appRouter.createCaller(context).pathpilot.projects.createFromRoadmapMilestone({ milestoneId })).resolves.toEqual({ projectId: "33333333-3333-4333-8333-333333333333", created: true });
    expect(mocks.createProjectFromRoadmapMilestone).toHaveBeenCalledWith(userId, milestoneId);
  });
});
