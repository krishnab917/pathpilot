import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

async function completedSources(db: SupabaseClient, userId: string) {
  const { data, error } = await db.from("simulations").select("id, career, completed_at, updated_at, behavioral_profile").eq("user_id", userId).eq("engine_version", "adaptive-v2").eq("status", "completed").order("completed_at", { ascending: false }).limit(5);
  if (error) throw new Error("Could not load the bounded simulation source set.");
  return (data ?? []) as SourceRow[];
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

export async function processNextDerivedAnalysis(workerToken: unknown) {
  if (typeof workerToken !== "string" || !/^[a-f0-9]{64}$/.test(workerToken)) return { authorized: false as const };
  const { url, key } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;
  if (!serviceRoleKey) throw new Error("The background worker is not configured.");
  const workerRpcClient = createClient(url, serviceRoleKey || key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await workerRpcClient.rpc("process_next_derived_analysis", { worker_token: workerToken });
  if (error || !data) throw new Error("Could not process queued analysis.");
  return data as { authorized: boolean; processed?: boolean; reason?: string; jobId?: string; status?: "completed" | "failed" };
}
