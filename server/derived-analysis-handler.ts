import type { Request, Response } from "express";
import { processNextDerivedAnalysis } from "./derived-analysis";
import { RateLimitExceededError, RateLimiterUnavailableError } from "./rate-limit";

export async function handleDerivedAnalysisWorker(req: Request, res: Response) {
  let body: unknown;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: "Invalid worker request." }); }
  const token = body && typeof body === "object" && "token" in body ? body.token : undefined;
  try {
    const result = await processNextDerivedAnalysis(token);
    if (!result.authorized) return res.status(403).json({ error: "worker-only" });
    return res.json({ ok: true, result });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil(error.retryAfterSeconds))));
      return res.status(429).json({ error: "Too many worker requests. Please try again shortly." });
    }
    if (error instanceof RateLimiterUnavailableError) return res.status(503).json({ error: "Request protection is temporarily unavailable. Please try again shortly." });
    console.error("[PathPilot] derived analysis worker failed");
    return res.status(500).json({ error: "derived analysis worker failed", code: "worker_rpc_unavailable", timestamp: new Date().toISOString() });
  }
}
