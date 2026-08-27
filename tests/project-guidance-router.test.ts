import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";
import { aiRateLimiter } from "../server/rate-limit";

const mocks = vi.hoisted(() => ({ getProjectWorkspace: vi.fn(), invokeLLM: vi.fn(), listLLMModels: vi.fn(), getCachedProjectGuidance: vi.fn(), cacheProjectGuidance: vi.fn(), invalidateProjectGuidanceCache: vi.fn() }));

vi.mock("../server/db", async importOriginal => {
  const actual = await importOriginal<typeof import("../server/db")>();
  return { ...actual, getProjectWorkspace: mocks.getProjectWorkspace };
});
vi.mock("../server/_core/llm", async importOriginal => {
  const actual = await importOriginal<typeof import("../server/_core/llm")>();
  return { ...actual, invokeLLM: mocks.invokeLLM, listLLMModels: mocks.listLLMModels };
});
vi.mock("../server/ai-result-cache", async importOriginal => ({ ...(await importOriginal<typeof import("../server/ai-result-cache")>()), getCachedProjectGuidance: mocks.getCachedProjectGuidance, cacheProjectGuidance: mocks.cacheProjectGuidance, invalidateProjectGuidanceCache: mocks.invalidateProjectGuidanceCache }));

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
const project = { id: projectId, userId, name: "Neighborhood garden tracker", description: "A small tool for tracking garden observations.", scopeStatement: "Track plants and watering; exclude personal contact data.", projectNotes: "Ask the assistant about the first screen.", skills: ["TypeScript", "SQL"], githubLink: null, liveUrl: null, status: "in_progress", progress: 20, startDate: null, completionDate: null, careerId: null, roadmapMilestoneId: null, goalIds: [], milestones: [{ id: "33333333-3333-4333-8333-333333333333", projectId, userId, title: "Sketch the screen", details: "Use three fields.", status: "not_started", progress: 0, targetDate: null, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() }], createdAt: new Date(), updatedAt: new Date() };

describe("project guidance router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProjectWorkspace.mockResolvedValue(project);
    mocks.getCachedProjectGuidance.mockResolvedValue(undefined);
    mocks.listLLMModels.mockResolvedValue({ data: [{ id: "gpt-5-mini" }] });
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ summary: "Start with one clear screen and a small observation form.", nextSteps: ["List the three fields.", "Sketch a compact screen."], watchouts: ["Keep the first version narrow."], questions: ["Which observation is most useful first?"] }) } }] });
  });

  afterEach(() => vi.restoreAllMocks());

  it("uses only the authenticated student’s selected project workspace and returns generated guidance", async () => {
    const result = await appRouter.createCaller(context).pathpilot.projects.guidance({ projectId, request: "What should I build first?" });

    expect(result.nextSteps).toEqual(["List the three fields.", "Sketch a compact screen."]);
    expect(result.cacheStatus).toBe("fresh");
    expect(mocks.getProjectWorkspace).toHaveBeenCalledWith(userId, projectId);
    expect(mocks.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5-mini", response_format: expect.any(Object) }));
    expect(mocks.cacheProjectGuidance).toHaveBeenCalledWith(userId, projectId, expect.stringMatching(/^[a-f0-9]{64}$/), expect.objectContaining({ summary: expect.any(String) }));
    const requestMessage = mocks.invokeLLM.mock.calls[0][0].messages[1].content as string;
    expect(requestMessage).toContain("Neighborhood garden tracker");
    expect(requestMessage).toContain("Track plants and watering");
    expect(requestMessage).not.toContain("Career matches:");
    expect(requestMessage).not.toContain("Simulation");
  });

  it("rejects malformed model output rather than returning a scripted fallback", async () => {
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "not json" } }] });

    await expect(appRouter.createCaller(context).pathpilot.projects.guidance({ projectId, request: "Help me sequence the work." })).rejects.toMatchObject({ code: "BAD_GATEWAY" });
  });

  it("returns a validated cache hit without calling the model when the project and request are unchanged", async () => {
    const rateLimiterRun = vi.spyOn(aiRateLimiter, "run");
    mocks.getCachedProjectGuidance.mockResolvedValue({ summary: "Reuse the validated response.", nextSteps: ["Keep scope narrow.", "Test one field."], watchouts: [], questions: [] });
    const result = await appRouter.createCaller(context).pathpilot.projects.guidance({ projectId, request: "What should I build first?" });
    expect(result).toMatchObject({ summary: "Reuse the validated response.", cacheStatus: "cached", cacheVersion: "project-guidance-v1" });
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
    expect(rateLimiterRun).not.toHaveBeenCalled();
  });

  it("bypasses and clears cached guidance only when the student explicitly refreshes", async () => {
    mocks.getCachedProjectGuidance.mockResolvedValue({ summary: "Would be cached.", nextSteps: ["One", "Two"], watchouts: [], questions: [] });
    await appRouter.createCaller(context).pathpilot.projects.guidance({ projectId, request: "What should I build first?", refresh: true });
    expect(mocks.invalidateProjectGuidanceCache).toHaveBeenCalledWith(userId, projectId);
    expect(mocks.getCachedProjectGuidance).not.toHaveBeenCalled();
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
  });
});
