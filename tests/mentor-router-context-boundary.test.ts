import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const mocks = vi.hoisted(() => ({ getOrCreateMentorConversation: vi.fn(), getMentorContextData: vi.fn(), getMentorConversationHistory: vi.fn(), addMentorMessage: vi.fn(), updateGoal: vi.fn(), invokeLLM: vi.fn(), listLLMModels: vi.fn() }));

vi.mock("../server/db", async importOriginal => ({
  ...(await importOriginal<typeof import("../server/db")>()),
  getOrCreateMentorConversation: mocks.getOrCreateMentorConversation,
  getMentorContextData: mocks.getMentorContextData,
  getMentorConversationHistory: mocks.getMentorConversationHistory,
  addMentorMessage: mocks.addMentorMessage,
  updateGoal: mocks.updateGoal,
}));
vi.mock("../server/_core/llm", async importOriginal => ({ ...(await importOriginal<typeof import("../server/_core/llm")>()), invokeLLM: mocks.invokeLLM, listLLMModels: mocks.listLLMModels }));

import { appRouter } from "../server/routers";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const context: TrpcContext = { user: { id: userA, email: "student-a@example.com", name: "Student A", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
const contextB: TrpcContext = { ...context, user: { id: userB, email: "student-b@example.com", name: "Student B", role: "user" } };

describe("Mentor context server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrCreateMentorConversation.mockResolvedValue({ id: "33333333-3333-4333-8333-333333333333" });
    mocks.getMentorContextData.mockResolvedValue({ profile: { grade: "11", countryCode: "US", careerPreferences: ["Technology"], privateLocation: "USER_B_PRIVATE_LOCATION" }, roadmap: null, goals: [{ id: "44444444-4444-4444-8444-444444444444", title: "Finish a small project", status: "in_progress", priority: "high", progress: 30, privateDescription: "USER_B_PRIVATE_GOAL" }], projects: [], simulation: null });
    mocks.getMentorConversationHistory.mockResolvedValue([{ role: "user", content: "Earlier question" }]);
    mocks.listLLMModels.mockResolvedValue({ data: [{ id: "gpt-5-mini" }] });
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ reply: "Choose one contained next step.", suggestedGoal: null, priorityAdjustment: { goalReference: "goal-1", priority: "medium" } }) } }] });
    mocks.updateGoal.mockResolvedValue({ title: "Finish a small project", priority: "medium" });
  });

  it("derives context only from the authenticated student, removes internal IDs, and resolves goal references server-side", async () => {
    const result = await appRouter.createCaller(context).pathpilot.mentor.send({ content: "Please reprioritize my goal." });
    const prompt = mocks.invokeLLM.mock.calls[0][0].messages[1].content as string;

    expect(result.updatedGoal).toMatchObject({ title: "Finish a small project", priority: "medium" });
    expect(mocks.getMentorContextData).toHaveBeenCalledWith(userA, { careerProfile: false, projects: false, simulation: false });
    expect(mocks.getMentorContextData).not.toHaveBeenCalledWith(userB, expect.anything());
    expect(prompt).toContain("mentor-allowlist-v1");
    expect(prompt).not.toContain("44444444-4444-4444-8444-444444444444");
    expect(prompt).not.toContain("USER_B_PRIVATE_LOCATION");
    expect(prompt).not.toContain("USER_B_PRIVATE_GOAL");
    expect(mocks.updateGoal).toHaveBeenCalledWith(userA, "44444444-4444-4444-8444-444444444444", { priority: "medium" });
  });

  it("rejects a model-supplied goal reference that is outside the authenticated student’s allowlist", async () => {
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ reply: "I cannot update an unlisted goal.", suggestedGoal: null, priorityAdjustment: { goalReference: "goal-6", priority: "medium" } }) } }] });

    await expect(appRouter.createCaller(context).pathpilot.mentor.send({ content: "Please reprioritize my goal." })).rejects.toMatchObject({ code: "BAD_GATEWAY" });
    expect(mocks.updateGoal).not.toHaveBeenCalled();
  });

  it("cannot put User A’s records into a Mentor request authenticated as User B", async () => {
    mocks.getMentorContextData.mockImplementation((userId: string) => Promise.resolve(userId === userB
      ? { profile: { grade: "10", countryCode: "IN", careerPreferences: [] }, roadmap: null, goals: [{ id: "55555555-5555-4555-8555-555555555555", title: "USER_B_ONLY_GOAL", status: "in_progress", priority: "medium", progress: 0 }], projects: [], simulation: null }
      : { profile: { grade: "11", countryCode: "US", careerPreferences: [] }, roadmap: null, goals: [{ id: "44444444-4444-4444-8444-444444444444", title: "USER_A_PRIVATE_GOAL", status: "in_progress", priority: "high", progress: 30 }], projects: [], simulation: null }));

    await appRouter.createCaller(contextB).pathpilot.mentor.send({ content: "Please prioritize my goals." });
    const prompt = mocks.invokeLLM.mock.calls[0][0].messages[1].content as string;

    expect(mocks.getMentorContextData).toHaveBeenCalledWith(userB, { careerProfile: false, projects: false, simulation: false });
    expect(prompt).toContain("USER_B_ONLY_GOAL");
    expect(prompt).not.toContain("USER_A_PRIVATE_GOAL");
    expect(prompt).not.toContain("44444444-4444-4444-8444-444444444444");
  });
});
