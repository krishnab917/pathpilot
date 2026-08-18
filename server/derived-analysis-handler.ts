import type { Request, Response } from "express";
import { processNextDerivedAnalysis } from "./derived-analysis";

export async function handleDerivedAnalysisWorker(req: Request, res: Response) {
  try {
    const result = await processNextDerivedAnalysis(req.body?.token);
    if (!result.authorized) return res.status(403).json({ error: "worker-only" });
    return res.json({ ok: true, result });
  } catch (error) {
    console.error("[PathPilot] derived analysis worker failed", error);
    return res.status(500).json({ error: "derived analysis worker failed", code: "worker_rpc_unavailable", timestamp: new Date().toISOString() });
  }
}
