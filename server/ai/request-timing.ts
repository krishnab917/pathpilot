import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type AiStage = "authentication" | "protection_lease" | "protection_burst" | "protection_daily" | "protection_release" | "context" | "conversation" | "history" | "save_question" | "prompt" | "model_selection" | "provider" | "provider_headers" | "provider_body" | "provider_retry" | "validation" | "save_result" | "total";
type Span = { stage: AiStage; startMs: number; durationMs: number; outcome: "ok" | "error" };
type Trace = { id: string; operation: "mentor" | "roadmap"; started: number; spans: Span[] };
const active = new AsyncLocalStorage<Trace>();
const round = (value: number) => Math.round(Math.max(0, value) * 10) / 10;

// An explicit allowlist: never accept user IDs, URLs, prompts, response text or errors.
export async function timeAiStage<T>(stage: AiStage, operation: () => PromiseLike<T>): Promise<T> {
  const started = performance.now();
  let outcome: Span["outcome"] = "ok";
  try { return await operation(); }
  catch (error) { outcome = "error"; throw error; }
  finally { record(stage, started, outcome); }
}

export function timeAiSync<T>(stage: AiStage, operation: () => T): T {
  const started = performance.now();
  let outcome: Span["outcome"] = "ok";
  try { return operation(); }
  catch (error) { outcome = "error"; throw error; }
  finally { record(stage, started, outcome); }
}

function record(stage: AiStage, started: number, outcome: Span["outcome"]) {
  const trace = active.getStore();
  if (trace && trace.spans.length < 64) trace.spans.push({ stage, startMs: round(started - trace.started), durationMs: round(performance.now() - started), outcome });
}

export async function traceAiRequest<T extends { ok: boolean }>(
  operation: Trace["operation"],
  timing: { receivedAt: number; authenticationMs: number; authenticated: boolean } | undefined,
  response: { headersSent?: boolean; getHeader?: (name: string) => unknown; setHeader?: (name: string, value: string) => unknown; once?: (event: string, callback: () => void) => unknown },
  run: () => Promise<T>,
): Promise<T> {
  const trace: Trace = { id: randomUUID(), operation, started: timing?.receivedAt ?? performance.now(), spans: [] };
  if (timing) trace.spans.push({ stage: "authentication", startMs: 0, durationMs: round(timing.authenticationMs), outcome: timing.authenticated ? "ok" : "error" });
  return active.run(trace, async () => {
    let ok = false;
    try { const result = await run(); ok = result.ok; return result; }
    finally {
      record("total", trace.started, ok ? "ok" : "error");
      if (!response.headersSent) {
        // Append permits multiple profiled procedures in one tRPC batch.
        const append = (name: string, value: string) => {
          const previous = response.getHeader?.(name);
          response.setHeader?.(name, typeof previous === "string" && previous ? `${previous}, ${value}` : value);
        };
        append("X-PathPilot-AI-Trace", trace.id);
        append("Server-Timing", trace.spans.map((span, index) => `${operation}_${span.stage}_${index};dur=${span.durationMs}`).join(", "));
      }
      console.info("[AI timing]", { traceId: trace.id, operation, outcome: ok ? "ok" : "error", spans: trace.spans });
      response.once?.("finish", () => console.info("[AI timing] response_sent", { traceId: trace.id, operation, elapsedMs: round(performance.now() - trace.started) }));
    }
  });
}
