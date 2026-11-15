import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { normalizePagePath } from "../../shared/public-seo";

export async function setupVite(app: Express, server: Server) {
  const [{ createServer: createViteServer }, { default: viteConfig }] =
    await Promise.all([import("vite"), import("../../vite.config")]);
  const serverOptions = {
    ...(viteConfig.server ?? {}),
    middlewareMode: true,
    hmr: { server },
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express, outputDirectory?: string) {
  const distPath = outputDirectory ?? (
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public"));
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // Public directories are served above. Private routes must use the empty,
  // noindex shell rather than the newly prerendered public homepage.
  app.use("*", (req, res, next) => {
    const route = normalizePagePath(req.originalUrl);
    if (route === "/api" || route.startsWith("/api/") || route.startsWith("/manus-storage/")) return next();
    const applicationRoute = /^\/(auth(?:\/update-password)?|contact|delete-account|onboarding|app(?:\/[^/]+)?|share\/[^/]+|portfolio\/[^/]+)$/.test(route);
    res.status(applicationRoute ? 200 : 404).sendFile(path.resolve(distPath, applicationRoute ? "app-shell.html" : "404.html"));
  });
}
