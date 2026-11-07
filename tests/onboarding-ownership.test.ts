import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";
import { emptyIntake } from "../shared/discovery-intake";
const mocks = vi.hoisted(() => ({ getStudentProfile: vi.fn(), getOnboardingDraft: vi.fn(), saveOnboardingDraft: vi.fn(), saveStudentProfile: vi.fn() }));
vi.mock("../server/db", async original => ({ ...await original<typeof import("../server/db")>(), ...mocks }));
import { appRouter } from "../server/routers";
const owner = "11111111-1111-4111-8111-111111111111";
const context = { user: { id: owner, role: "user" }, supabase: {}, req: {}, res: {} } as TrpcContext;
const input = { grade: "Grade 11", location: "Example region", countryCode: "US", educationSystem: "General", interests: [], skills: [], activities: [], careerPreferences: [], discoveryIntake: emptyIntake() };
beforeEach(() => vi.clearAllMocks());
describe("private onboarding API", () => {
  it("uses only authenticated ownership for profile and draft reads/writes", async () => {
    const api = appRouter.createCaller(context).pathpilot.profile;
    await api.get(); await api.getDraft(); await api.saveDraft({ currentStep: 2, profile: input }); await api.completeOnboarding(input);
    expect(mocks.getStudentProfile).toHaveBeenCalledWith(owner);
    expect(mocks.getOnboardingDraft).toHaveBeenCalledWith(owner);
    expect(mocks.saveOnboardingDraft).toHaveBeenCalledWith(owner, 2, input);
    expect(mocks.saveStudentProfile).toHaveBeenCalledWith(owner, input);
  });
  it("rejects anonymous access before repository calls", async () => {
    const api = appRouter.createCaller({ ...context, user: null, supabase: null }).pathpilot.profile;
    await expect(api.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(api.getDraft()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(api.saveDraft({ currentStep: 0, profile: input })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(api.completeOnboarding(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.saveStudentProfile).not.toHaveBeenCalled();
  });
  it("rejects cross-student IDs and client-supplied recommendation scores", async () => {
    const api = appRouter.createCaller(context).pathpilot.profile;
    await expect(api.completeOnboarding({ ...input, userId: "victim" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(api.saveDraft({ currentStep: 2, profile: { ...input, score: 100 } } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.saveStudentProfile).not.toHaveBeenCalled(); expect(mocks.saveOnboardingDraft).not.toHaveBeenCalled();
  });
  it("returns previously saved partial progress for resumption", async () => {
    const draft = { currentStep: 3, payload: input };
    mocks.getOnboardingDraft.mockResolvedValue(draft);
    expect(await appRouter.createCaller(context).pathpilot.profile.getDraft()).toEqual(draft);
  });
});
