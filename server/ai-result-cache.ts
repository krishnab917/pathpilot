import { createHash } from "node:crypto";
import { currentSupabaseClient } from "./supabase";

export const PROJECT_GUIDANCE_CACHE_VERSION = "project-guidance-v1";
const PROJECT_GUIDANCE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ProjectGuidanceCacheValue = { summary: string; nextSteps: string[]; watchouts: string[]; questions: string[] };

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map(key => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function projectGuidanceInputHash(input: { request: string; project: { name: string; description: string; scopeStatement: string | null; projectNotes: string | null; skills: string[]; status: string; progress: number; startDate: string | null; completionDate: string | null; githubLink: string | null; liveUrl: string | null; milestones: Array<{ title: string; details: string | null; status: string; progress: number; targetDate: string | null; sortOrder: number }> } }) {
  return createHash("sha256").update(stableJson(input)).digest("hex");
}

export async function getCachedProjectGuidance(userId: string, projectId: string, inputHash: string) {
  const { data, error } = await currentSupabaseClient().from("ai_result_cache").select("result").eq("user_id", userId).eq("operation", "project_guidance").eq("subject_id", projectId).eq("cache_version", PROJECT_GUIDANCE_CACHE_VERSION).eq("input_hash", inputHash).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("We could not read the saved project guidance result.");
  return data?.result as ProjectGuidanceCacheValue | undefined;
}

export async function cacheProjectGuidance(userId: string, projectId: string, inputHash: string, result: ProjectGuidanceCacheValue) {
  const { error } = await currentSupabaseClient().from("ai_result_cache").upsert({ user_id: userId, operation: "project_guidance", subject_id: projectId, cache_version: PROJECT_GUIDANCE_CACHE_VERSION, input_hash: inputHash, result, expires_at: new Date(Date.now() + PROJECT_GUIDANCE_TTL_MS).toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id,operation,subject_id,cache_version,input_hash" });
  if (error) throw new Error("We could not save the project guidance result.");
}

export async function invalidateProjectGuidanceCache(userId: string, projectId: string) {
  const { error } = await currentSupabaseClient().from("ai_result_cache").delete().eq("user_id", userId).eq("operation", "project_guidance").eq("subject_id", projectId);
  if (error) throw new Error("We could not refresh the saved project guidance result.");
}
