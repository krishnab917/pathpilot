import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: () => mocks.client }));

import { cacheProjectGuidance, getCachedProjectGuidance, invalidateProjectGuidanceCache, projectGuidanceInputHash } from "../server/ai-result-cache";

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const input = { request: "What should I build first?", project: { name: "Garden tracker", description: "Track observations.", scopeStatement: null, projectNotes: null, skills: ["TypeScript"], status: "in_progress", progress: 20, startDate: null, completionDate: null, githubLink: null, liveUrl: null, milestones: [{ title: "Sketch", details: null, status: "not_started", progress: 0, targetDate: null, sortOrder: 0 }] } };

describe("versioned AI result cache", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hashes all material project-assistant inputs deterministically and changes the key when either source changes", () => {
    const same = projectGuidanceInputHash({ ...input, project: { ...input.project, skills: [...input.project.skills] } });
    expect(projectGuidanceInputHash(input)).toBe(same);
    expect(projectGuidanceInputHash({ ...input, request: "What is the smallest next step?" })).not.toBe(same);
    expect(projectGuidanceInputHash({ ...input, project: { ...input.project, progress: 40 } })).not.toBe(same);
    expect(projectGuidanceInputHash({ ...input, project: { ...input.project, milestones: [{ ...input.project.milestones[0], title: "Prototype" }] } })).not.toBe(same);
  });

  it("reads only a current owner-scoped versioned cache entry", async () => {
    const chain: any = { select: vi.fn(), eq: vi.fn(), gt: vi.fn(), maybeSingle: vi.fn() };
    chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.gt.mockReturnValue(chain); chain.maybeSingle.mockResolvedValue({ data: { result: { summary: "Cached", nextSteps: ["One", "Two"], watchouts: [], questions: [] } }, error: null });
    mocks.client = { from: vi.fn(() => chain) };
    const result = await getCachedProjectGuidance(userId, projectId, "a".repeat(64));
    expect(result?.summary).toBe("Cached");
    expect(chain.eq).toHaveBeenCalledWith("user_id", userId);
    expect(chain.eq).toHaveBeenCalledWith("subject_id", projectId);
    expect(chain.eq).toHaveBeenCalledWith("cache_version", "project-guidance-v1");
    expect(chain.gt).toHaveBeenCalledWith("expires_at", expect.any(String));
  });

  it("writes only the validated output with a versioned hash and explicitly invalidates by owner and project", async () => {
    const chain: any = { upsert: vi.fn(), delete: vi.fn(), eq: vi.fn() };
    chain.upsert.mockResolvedValue({ error: null }); chain.delete.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.eq.mockImplementation(() => chain);
    mocks.client = { from: vi.fn(() => chain) };
    const output = { summary: "Validated", nextSteps: ["One", "Two"], watchouts: [], questions: [] };
    await cacheProjectGuidance(userId, projectId, "b".repeat(64), output);
    expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId, subject_id: projectId, cache_version: "project-guidance-v1", input_hash: "b".repeat(64), result: output }), expect.objectContaining({ onConflict: "user_id,operation,subject_id,cache_version,input_hash" }));
    await invalidateProjectGuidanceCache(userId, projectId);
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("user_id", userId);
    expect(chain.eq).toHaveBeenCalledWith("subject_id", projectId);
  });
});
