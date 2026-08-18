import { createHash, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildBehaviorEvolution, type CompletedSimulationBehavior } from "./simulation/evolution";
import { currentSupabaseClient, getSupabaseConfig } from "./supabase";

export const DERIVED_ANALYSIS_TYPE = "simulation_evolution" as const;
export type DerivedAnalysisStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
type SourceRow = { id: string; career: string; completed_at: string | null; updated_at: string | null; behavioral_profile: unknown };
type Snapshot = { version: "simulation-evolution-v1"; completedSimulationCount: number; includedSimulationCount: number; mostRecentCompletedAt: string | null; hasEvolvingFocus: boolean };

function statusRow(row: any) {
  return { id: row.id as string, status: row.status as DerivedAnalysisStatus, attemptCount: Number(row.attempt_count), requestedAt: new Date(row.requested_at), startedAt: row.started_at ? new Date(row.started_at) : null, completedAt: row.completed_at ? new Date(row.completed_at) : null, cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null, errorCode: row.error_code as "processing_failed" | null, snapshot: row.snapshot as Snapshot | null, sourceHash: row.source_hash as string | null };
}

function sourceHash(rows: SourceRow[]) {
  const source = rows.map(row => ({ id: row.id, completedAt: row.completed_at, updatedAt: row.updated_at })).sort((left, right) => left.id.localeCompare(right.id));
  return createHash("sha256").update(JSON.stringify(source)).digest("hex");
}

function toEvolutionSources(rows: SourceRow[]): CompletedSimulationBehavior[] {
  return rows.map(row => ({ id: row.id, career: row.career, completedAt: row.completed_at ? new Date(row.completed_at) : null, behavioralProfile: row.behavioral_profile as CompletedSimulationBehavior["behavioralProfile"] }));
}

async function completedSources(db: SupabaseClient, userId: string) {
  const { data, error } = await db.from("simulations").select("id, career, completed_at, updated_at, behavioral_profile").eq("user_id", userId).eq("engine_version", "adaptive-v2").eq("status", "completed").order("completed_at", { ascending: false }).limit(5);
  if (error) throw new Error("Could not load the bounded simulation source set.");
  return (data ?? []) as SourceRow[];
}

function workerClient() {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;
  if (!serviceRoleKey) throw new Error("The background worker is not configured.");
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export async function isValidDerivedAnalysisWorkerToken(value: unknown) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) return false;
  const { data, error } = await workerClient().from("background_worker_credentials").select("token_hash").eq("worker_name", "derived_analysis").maybeSingle();
  if (error || !data?.token_hash) return false;
  const expected = Buffer.from(data.token_hash, "hex");
  const received = Buffer.from(createHash("sha256").update(value).digest("hex"), "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function getDerivedAnalysisStatus(userId: string) {
  const db = currentSupabaseClient();
  const [{ data, error }, sources] = await Promise.all([
    db.from("derived_analysis_jobs").select("*").eq("user_id", userId).eq("analysis_type", DERIVED_ANALYSIS_TYPE).order("requested_at", { ascending: false }).limit(1).maybeSingle(),
    completedSources(db, userId),
  ]);
  if (error) throw new Error("Could not load analysis status.");
  const job = data ? statusRow(data) : null;
  const currentSourceHash = sourceHash(sources);
  return { job: job ? { ...job, isCurrent: job.status === "completed" && job.sourceHash === currentSourceHash } : null, currentSourceCount: sources.length };
}

export async function requestDerivedAnalysis(userId: string) {
  const db = currentSupabaseClient();
  const { data: active, error: activeError } = await db.from("derived_analysis_jobs").select("*").eq("user_id", userId).eq("analysis_type", DERIVED_ANALYSIS_TYPE).in("status", ["queued", "running"]).limit(1).maybeSingle();
  if (activeError) throw new Error("Could not prepare analysis.");
  if (active) return statusRow(active);
  const { data, error } = await db.from("derived_analysis_jobs").insert({ user_id: userId, analysis_type: DERIVED_ANALYSIS_TYPE }).select("*").single();
  if (error || !data) throw new Error("Could not queue analysis.");
  return statusRow(data);
}

export async function retryDerivedAnalysis(userId: string, jobId: string) {
  const db = currentSupabaseClient();
  const { data, error } = await db.from("derived_analysis_jobs").update({ status: "queued", attempt_count: 0, source_hash: null, snapshot: null, error_code: null, requested_at: new Date().toISOString(), started_at: null, completed_at: null, cancelled_at: null }).eq("id", jobId).eq("user_id", userId).eq("analysis_type", DERIVED_ANALYSIS_TYPE).in("status", ["failed", "cancelled"]).select("*").maybeSingle();
  if (error) throw new Error("Could not retry analysis.");
  if (!data) throw new Error("Analysis is not available for retry.");
  return statusRow(data);
}

export async function cancelDerivedAnalysis(userId: string, jobId: string) {
  const { data, error } = await currentSupabaseClient().from("derived_analysis_jobs").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", jobId).eq("user_id", userId).eq("analysis_type", DERIVED_ANALYSIS_TYPE).eq("status", "queued").select("*").maybeSingle();
  if (error) throw new Error("Could not cancel analysis.");
  if (!data) throw new Error("Analysis is no longer waiting and cannot be cancelled.");
  return statusRow(data);
}

export async function processNextDerivedAnalysis() {
  const db = workerClient();
  const { data: next, error: nextError } = await db.from("derived_analysis_jobs").select("*").eq("analysis_type", DERIVED_ANALYSIS_TYPE).eq("status", "queued").order("requested_at", { ascending: true }).limit(1).maybeSingle();
  if (nextError) throw new Error("Could not find queued analysis.");
  if (!next) return { processed: false as const, reason: "empty" as const };
  const { data: claimed, error: claimError } = await db.from("derived_analysis_jobs").update({ status: "running", attempt_count: Number((next as any).attempt_count) + 1, started_at: new Date().toISOString() }).eq("id", (next as any).id).eq("status", "queued").select("*").maybeSingle();
  if (claimError) throw new Error("Could not claim queued analysis.");
  if (!claimed) return { processed: false as const, reason: "claimed_elsewhere" as const };
  try {
    const sources = await completedSources(db, (claimed as any).user_id);
    const evolution = buildBehaviorEvolution(toEvolutionSources(sources));
    const snapshot: Snapshot = { version: "simulation-evolution-v1", completedSimulationCount: evolution?.completedSimulationCount ?? 0, includedSimulationCount: evolution?.includedSimulationCount ?? 0, mostRecentCompletedAt: evolution?.mostRecentCompletedAt?.toISOString() ?? null, hasEvolvingFocus: Boolean(evolution?.evolvingFocus) };
    const { error: completeError } = await db.from("derived_analysis_jobs").update({ status: "completed", source_hash: sourceHash(sources), snapshot, error_code: null, completed_at: new Date().toISOString() }).eq("id", (claimed as any).id).eq("status", "running");
    if (completeError) throw new Error("Could not complete analysis.");
    return { processed: true as const, jobId: (claimed as any).id as string, status: "completed" as const };
  } catch (error) {
    await db.from("derived_analysis_jobs").update({ status: "failed", error_code: "processing_failed", completed_at: new Date().toISOString() }).eq("id", (claimed as any).id).eq("status", "running");
    console.error("[PathPilot] derived analysis failed", error);
    return { processed: true as const, jobId: (claimed as any).id as string, status: "failed" as const };
  }
}
