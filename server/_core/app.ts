import express from "express";
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

  return app;
}
