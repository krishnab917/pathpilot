import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

// A repeatable network-latency experiment, never a live provider/database test.
const mocks = vi.hoisted(() => Object.fromEntries([
  "getOrCreateMentorConversation", "getMentorContextData", "getMentorConversationHistory", "addMentorMessage",
  "getStudentProfile", "getLatestCompletedAdaptiveSimulation", "listGoals", "listProjects", "getActiveRoadmap", "createRoadmap",
  "invokeLLM", "listLLMModels",
].map(key => [key, vi.fn()])));
vi.mock("../server/db", async original => ({ ...await original<typeof import("../server/db")>(), ...Object.fromEntries(Object.entries(mocks).filter(([key]) => !["invokeLLM", "listLLMModels"].includes(key))) }));
vi.mock("../server/_core/llm", () => ({ invokeLLM: mocks.invokeLLM, listLLMModels: mocks.listLLMModels }));
import { appRouter } from "../server/routers";

const context = { user: { id: "11111111-1111-4111-8111-111111111111", email: null, name: null, role: "user" }, supabase: {}, req: {}, res: {} } as TrpcContext;
const delay = <T>(ms: number, value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), ms));
const profile = { grade: "11", location: "", countryCode: "US", interests: [], skills: [], activities: [], careerPreferences: [], updatedAt: new Date(0) };
const milestones = [1, 2, 3].flatMap(year => ["skill", "project", "experience"].map(category => ({ year, category, title: "Explore a next step", description: "Practice a focused activity and reflect on what you learn.", deadline: null, priority: "medium", estimatedHours: 10, resources: [] })));
const samples: Record<string, number[]> = {};
const report = console.info.bind(console);
async function measure(name: string, operation: () => Promise<unknown>) {
  const start = performance.now();
  await operation();
  (samples[name] ??= []).push(Math.round(performance.now() - start));
}

describe("AI latency with controlled 30ms database round trips and a 100ms provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation((...args) => { if (String(args[0]).startsWith("[Controlled benchmark]")) report(...args); });
    mocks.getOrCreateMentorConversation.mockImplementation(() => delay(30, { id: "conversation" }));
    mocks.getMentorContextData.mockImplementation(() => delay(60, { profile, roadmap: null, goals: [], projects: [], simulation: null }));
    mocks.getMentorConversationHistory.mockImplementation(() => delay(30, []));
    mocks.addMentorMessage.mockImplementation(() => delay(60, undefined));
    mocks.getStudentProfile.mockImplementation(() => delay(30, profile));
    mocks.getLatestCompletedAdaptiveSimulation.mockImplementation(() => delay(30, undefined));
    mocks.listGoals.mockImplementation(() => delay(30, []));
    mocks.listProjects.mockImplementation(() => delay(30, []));
    mocks.getActiveRoadmap.mockImplementation(() => delay(60, undefined));
    mocks.createRoadmap.mockImplementation(() => delay(150, { id: "saved-roadmap", milestones }));
    mocks.listLLMModels.mockResolvedValue({ data: [{ id: "configured-model" }] });
    mocks.invokeLLM.mockImplementation((input: any) => delay(100, { choices: [{ message: { content: JSON.stringify(input.response_format.json_schema.name === "mentor_response" ? { reply: "Explore one practical next step.", suggestedGoal: null, priorityAdjustment: null } : { milestones }) } }] }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("starts conversation history before independent context finishes, but persists only after both reads", async () => {
    let release!: (value: unknown) => void;
    mocks.getMentorContextData.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const pending = appRouter.createCaller(context).pathpilot.mentor.send({ content: "Help me plan my week." });
    await vi.waitFor(() => expect(mocks.getMentorConversationHistory).toHaveBeenCalledTimes(1));
    expect(mocks.addMentorMessage).not.toHaveBeenCalled();
    release({ profile, roadmap: null, goals: [], projects: [], simulation: null });
    await expect(pending).resolves.toMatchObject({ reply: "Explore one practical next step." });
    expect(mocks.addMentorMessage.mock.calls.map(call => call[2])).toEqual(["user", "assistant"]);
  });

  it("runs Mentor three times through validation and persistence", async () => {
    const caller = appRouter.createCaller(context);
    for (let i = 0; i < 3; i++) await measure("mentor", async () => {
      expect(await caller.pathpilot.mentor.send({ content: "Help me plan my week." })).toMatchObject({ reply: "Explore one practical next step." });
    });
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(3);
    expect(mocks.addMentorMessage).toHaveBeenCalledTimes(6);
    console.info("[Controlled benchmark] Mentor server ms", samples.mentor);
  });

  it("measures Roadmap preflight separately from generation three times", async () => {
    const caller = appRouter.createCaller(context);
    for (let i = 0; i < 3; i++) {
      await measure("roadmapPreflight", () => caller.pathpilot.roadmap.preflight({ targetCareer: "Software Engineer" }));
      await measure("roadmapGeneration", async () => {
        expect(await caller.pathpilot.roadmap.generate({ targetCareer: "Software Engineer" })).toMatchObject({ id: "saved-roadmap" });
      });
    }
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(3);
    expect(mocks.createRoadmap).toHaveBeenCalledTimes(3);
    console.info("[Controlled benchmark] Roadmap preflight / generation ms", samples.roadmapPreflight, samples.roadmapGeneration);
  });
});
