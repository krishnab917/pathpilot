import type { Request, Response } from "express";
import { isValidDerivedAnalysisWorkerToken, processNextDerivedAnalysis } from "./derived-analysis";

export async function handleDerivedAnalysisWorker(req: Request, res: Response) {
  if (!(await isValidDerivedAnalysisWorkerToken(req.body?.token))) return res.status(403).json({ error: "worker-only" });
  try {
    const result = await processNextDerivedAnalysis();
    return res.json({ ok: true, result });
  } catch (error) {
    console.error("[PathPilot] derived analysis worker failed", error);
    return res.status(500).json({ error: "derived analysis worker failed", timestamp: new Date().toISOString() });
  }
}
