import express, { type ErrorRequestHandler } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleDerivedAnalysisWorker } from "../derived-analysis-handler";
import { API_BODY_LIMIT, WORKER_BODY_LIMIT, createIngressGuard, securityHeaders } from "../http-security";

/**
 * Builds the API application without binding it to a port.
 *
 * Keeping this separate from the local server entry point lets Vercel invoke the
 * exact same tRPC, worker, and storage-compatibility routes as a function.
 */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", false);
  app.use(securityHeaders);
  app.use("/api", createIngressGuard());
  // Worker payloads contain only one opaque token; parse them before normal JSON.
  app.post("/api/scheduled/derived-analysis", express.text({ type: "*/*", limit: WORKER_BODY_LIMIT, inflate: false }), handleDerivedAnalysisWorker);
  // Largest normal input is 30 bounded roadmap milestones, including resources.
  // There is no resume/file upload endpoint. One MiB accommodates Unicode text.
  app.use(express.json({ limit: API_BODY_LIMIT, inflate: false }));
  app.use(express.urlencoded({ limit: "32kb", extended: false, parameterLimit: 100, inflate: false }));
  registerStorageProxy(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // API misses must not continue into the development/production SPA fallback.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "API route not found." } });
  });

  // Body parser failures happen before tRPC can format an error response.
  // Never reflect request bodies, credentials, or upstream error details.
  const handleApiError: ErrorRequestHandler = (error, req, res, next) => {
    const parserFailure = ["entity.parse.failed", "entity.too.large", "parameters.too.many", "encoding.unsupported", "charset.unsupported"].includes(error?.type);
    if (res.headersSent || (!parserFailure && !(req.path === "/api" || req.path.startsWith("/api/")))) {
      next(error);
      return;
    }
    const status = error?.type === "entity.parse.failed" ? 400
      : ["entity.too.large", "parameters.too.many"].includes(error?.type) ? 413
      : ["encoding.unsupported", "charset.unsupported"].includes(error?.type) ? 415 : 500;
    res.status(status).json({ error: {
      code: status === 400 ? "BAD_REQUEST" : status === 413 ? "PAYLOAD_TOO_LARGE" : status === 415 ? "UNSUPPORTED_MEDIA_TYPE" : "INTERNAL_SERVER_ERROR",
      message: status === 400 ? "Invalid JSON request body." : status === 413 ? "Request body is too large." : status === 415 ? "Unsupported request encoding." : "An unexpected API error occurred.",
    } });
  };
  app.use(handleApiError);

  return app;
}
