import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const mocks = vi.hoisted(() => ({ updateProject: vi.fn(), createProjectWorkspaceMilestone: vi.fn(), deleteProjectWorkspaceMilestone: vi.fn(), invalidateProjectGuidanceCache: vi.fn() }));

vi.mock("../server/db", async importOriginal => {
  const actual = await importOriginal<typeof import("../server/db")>();
  return { ...actual, updateProject: mocks.updateProject, createProjectWorkspaceMilestone: mocks.createProjectWorkspaceMilestone, deleteProjectWorkspaceMilestone: mocks.deleteProjectWorkspaceMilestone };
});
vi.mock("../server/ai-result-cache", async importOriginal => ({ ...(await importOriginal<typeof import("../server/ai-result-cache")>()), invalidateProjectGuidanceCache: mocks.invalidateProjectGuidanceCache }));

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const milestoneId = "33333333-3333-4333-8333-333333333333";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("project workspace router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateProject.mockResolvedValue({ id: projectId });
    mocks.createProjectWorkspaceMilestone.mockResolvedValue({ id: milestoneId });
    mocks.deleteProjectWorkspaceMilestone.mockResolvedValue({ id: milestoneId, deleted: true });
    mocks.invalidateProjectGuidanceCache.mockResolvedValue(undefined);
  });

  it("writes editable workspace details only through the signed-in student", async () => {
    await expect(appRouter.createCaller(context).pathpilot.projects.update({ id: projectId, scopeStatement: "A small source-checked project." })).resolves.toMatchObject({ id: projectId });
    expect(mocks.updateProject).toHaveBeenCalledWith(userId, projectId, expect.objectContaining({ scopeStatement: "A small source-checked project." }));
    expect(mocks.invalidateProjectGuidanceCache).toHaveBeenCalledWith(userId, projectId);
  });

  it("creates and deletes project milestones only through the signed-in student", async () => {
    await expect(appRouter.createCaller(context).pathpilot.projects.createMilestone({ projectId, title: "Draft the interface" })).resolves.toMatchObject({ id: milestoneId });
    expect(mocks.createProjectWorkspaceMilestone).toHaveBeenCalledWith(userId, projectId, expect.objectContaining({ title: "Draft the interface" }));
    await expect(appRouter.createCaller(context).pathpilot.projects.deleteMilestone({ projectId, id: milestoneId })).resolves.toEqual({ id: milestoneId, deleted: true });
    expect(mocks.deleteProjectWorkspaceMilestone).toHaveBeenCalledWith(userId, projectId, milestoneId);
    expect(mocks.invalidateProjectGuidanceCache).toHaveBeenCalledTimes(2);
    expect(mocks.invalidateProjectGuidanceCache).toHaveBeenCalledWith(userId, projectId);
  });
});
