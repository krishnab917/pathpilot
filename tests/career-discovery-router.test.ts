import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";
import { simulationCareerCatalog } from "../server/simulation/catalog";

const mocks = vi.hoisted(() => ({ invokeLLM: vi.fn(), listLLMModels: vi.fn(), getStudentProfile: vi.fn(), getCareerMatches: vi.fn(), getActiveRoadmap: vi.fn(), getLatestCompletedAdaptiveSimulation: vi.fn(), listGoals: vi.fn(), listProjects: vi.fn(), replaceCareerMatches: vi.fn() }));

vi.mock("../server/_core/llm", () => ({ invokeLLM: mocks.invokeLLM, listLLMModels: mocks.listLLMModels }));
vi.mock("../server/db", async importOriginal => {
  const actual = await importOriginal<typeof import("../server/db")>();
  return { ...actual, getStudentProfile: mocks.getStudentProfile, getCareerMatches: mocks.getCareerMatches, getActiveRoadmap: mocks.getActiveRoadmap, getLatestCompletedAdaptiveSimulation: mocks.getLatestCompletedAdaptiveSimulation, listGoals: mocks.listGoals, listProjects: mocks.listProjects, replaceCareerMatches: mocks.replaceCareerMatches };
});

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
const profile = { id: "22222222-2222-4222-8222-222222222222", userId, grade: "11", location: "New York", interests: ["technology"], skills: ["research"], activities: ["robotics"], careerPreferences: ["collaborative work"], onboardingCompletedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
const matches = ["Software Engineer", "AI / Machine Learning Engineer", "Doctor / Physician", "Lawyer", "Entrepreneur / Startup Founder"].map((name, index) => ({ name, description: "A realistic career direction with meaningful student-facing context.", salaryRange: "Location-dependent estimate", educationRequirements: "A relevant postsecondary pathway or credential may be helpful.", requiredSkills: ["Research", "Communication", "Problem solving"], dailyResponsibilities: ["Analyze information", "Collaborate with others"], relatedCareers: ["Related Path A", "Related Path B"], matchScore: 75 + index, reasoning: "This direction aligns with the supplied interests, current strengths, and opportunities to build practical experience.", strengths: ["Research"], missingSkills: ["Practice"], realityCheck: "This path takes sustained skill building, exploration, and real-world feedback over time.", nextSteps: ["Explore an introductory project", "Speak with a practitioner"] }));
const response = (payload: unknown) => ({ choices: [{ message: { content: JSON.stringify(payload) } }] });

describe("pathpilot.discovery.analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listLLMModels.mockResolvedValue({ data: [{ id: "gpt-5-mini" }] });
    mocks.getStudentProfile.mockResolvedValue(profile);
    mocks.getCareerMatches.mockResolvedValue([]);
    mocks.getActiveRoadmap.mockResolvedValue(undefined);
    mocks.getLatestCompletedAdaptiveSimulation.mockResolvedValue(undefined);
    mocks.listGoals.mockResolvedValue([]);
    mocks.listProjects.mockResolvedValue([]);
    mocks.replaceCareerMatches.mockResolvedValue({ persisted: true });
  });

  it("retries an invalid response and persists exactly five validated matches", async () => {
    mocks.invokeLLM.mockResolvedValueOnce(response({ matches: matches.slice(0, 4) })).mockResolvedValueOnce(response({ matches }));
    const result = await appRouter.createCaller(context).pathpilot.discovery.analyze();
    expect(result).toEqual({ persisted: true });
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(2);
    expect(mocks.replaceCareerMatches).toHaveBeenCalledWith(userId, matches);
  });

  it("reuses a current five-career analysis without invoking the model or consuming a generation path", async () => {
    const saved = matches.map(match => ({ career: { name: match.name, description: match.description }, generatedAt: new Date(profile.updatedAt) }));
    mocks.getCareerMatches.mockResolvedValue(saved);
    await expect(appRouter.createCaller(context).pathpilot.discovery.analyze()).resolves.toEqual(saved);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
    expect(mocks.replaceCareerMatches).not.toHaveBeenCalled();
  });

  it("returns BAD_GATEWAY after invalid responses exhaust the retry budget", async () => {
    mocks.invokeLLM.mockResolvedValue(response({ matches: matches.slice(0, 4) }));
    await expect(appRouter.createCaller(context).pathpilot.discovery.analyze()).rejects.toMatchObject({ code: "BAD_GATEWAY", message: "Career guidance is temporarily unavailable. Please try again shortly." });
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(2);
    expect(mocks.replaceCareerMatches).not.toHaveBeenCalled();
  });

  it("returns the safe gateway error without a second provider call when the AI provider fails", async () => {
    mocks.invokeLLM.mockRejectedValue(new Error("provider unavailable"));
    await expect(appRouter.createCaller(context).pathpilot.discovery.analyze()).rejects.toMatchObject({ code: "BAD_GATEWAY", message: "Career guidance is temporarily unavailable. Please try again shortly." });
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(mocks.replaceCareerMatches).not.toHaveBeenCalled();
  });

  it("rejects an otherwise complete discovery response that includes an unsupported career", async () => {
    mocks.invokeLLM.mockResolvedValue(response({ matches: [...matches.slice(0, 4), { ...matches[4], name: "Registered Nurse" }] }));
    await expect(appRouter.createCaller(context).pathpilot.discovery.analyze()).rejects.toMatchObject({ code: "BAD_GATEWAY" });
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(2);
    expect(mocks.replaceCareerMatches).not.toHaveBeenCalled();
  });

  it("confirms the signed-in profile before a long-running discovery request begins", async () => {
    await expect(appRouter.createCaller(context).pathpilot.discovery.preflight()).resolves.toEqual({ profileReady: true });
    expect(mocks.getStudentProfile).toHaveBeenCalledWith(userId);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("confirms the signed-in profile before a long-running roadmap request begins", async () => {
    await expect(appRouter.createCaller(context).pathpilot.roadmap.preflight({ targetCareer: "Data scientist" })).resolves.toEqual({ profileReady: true });
    expect(mocks.getStudentProfile).toHaveBeenCalledWith(userId);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("accepts every canonical career at the roadmap server boundary", async () => {
    for (const career of simulationCareerCatalog) {
      await expect(appRouter.createCaller(context).pathpilot.roadmap.preflight({ targetCareer: career.name })).resolves.toEqual({ profileReady: true });
    }
    expect(mocks.getStudentProfile).toHaveBeenCalledTimes(simulationCareerCatalog.length);
  });

  it("rejects unsupported careers at the legacy roadmap and simulation server boundaries", async () => {
    await expect(appRouter.createCaller(context).pathpilot.roadmap.preflight({ targetCareer: "Registered Nurse" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(context).pathpilot.roadmap.generate({ targetCareer: "Registered Nurse" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(context).pathpilot.simulations.start({ career: "Registered Nurse" })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "That career simulation is not currently available. Choose one from the supported simulation catalog." });
    await expect(appRouter.createCaller(context).pathpilot.simulations.start({ career: "Software Engineer" })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "This legacy simulation endpoint is retired. Start the dedicated simulation from the supported career catalog." });
    expect(mocks.getStudentProfile).not.toHaveBeenCalled();
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("requires explicit confirmation before replacing a different active roadmap career", async () => {
    mocks.getActiveRoadmap.mockResolvedValue({ targetCareer: "Software Engineer", milestones: [] });
    await expect(appRouter.createCaller(context).pathpilot.roadmap.preflight({ targetCareer: "Doctor / Physician" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: "Changing your active roadmap career requires your explicit confirmation." });
    await expect(appRouter.createCaller(context).pathpilot.roadmap.preflight({ targetCareer: "Doctor / Physician", confirmCareerChange: true })).resolves.toEqual({ profileReady: true });
  });

  it("reuses an unchanged active roadmap before the shared AI limiter or model generation path", async () => {
    const activeRoadmap = {
      id: "33333333-3333-4333-8333-333333333333",
      userId,
      targetCareer: "Data Scientist",
      completionPercentage: 20,
      status: "active",
      createdAt: new Date(profile.updatedAt),
      updatedAt: new Date(profile.updatedAt.getTime() + 1_000),
      milestones: [],
    };
    mocks.getActiveRoadmap.mockResolvedValue(activeRoadmap);

    await expect(appRouter.createCaller(context).pathpilot.roadmap.generate({ targetCareer: "Data Scientist" })).resolves.toEqual(activeRoadmap);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });
});
