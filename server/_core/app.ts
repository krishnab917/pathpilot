import express, { type ErrorRequestHandler } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleDerivedAnalysisWorker } from "../derived-analysis-handler";

/**
 * Builds the API application without binding it to a port.
 *
 * Keeping this separate from the local server entry point lets Vercel invoke the
 * exact same tRPC, worker, and storage-compatibility routes as a function.
 */
export function createApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  app.post(
    "/api/scheduled/derived-analysis",
    express.text({ type: "*/*" }),
    handleDerivedAnalysisWorker
  );
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
    if (!(req.path === "/api" || req.path.startsWith("/api/")) || res.headersSent) {
      next(error);
      return;
    }
    const status = error?.type === "entity.parse.failed" ? 400
      : error?.type === "entity.too.large" ? 413 : 500;
    res.status(status).json({ error: {
      code: status === 400 ? "BAD_REQUEST" : status === 413 ? "PAYLOAD_TOO_LARGE" : "INTERNAL_SERVER_ERROR",
      message: status === 400 ? "Invalid JSON request body." : status === 413 ? "Request body is too large." : "An unexpected API error occurred.",
    } });
  };
  app.use(handleApiError);

  return app;
}
