import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { robots, sitemap } from "./shared/public-seo";

const configuredAllowedHosts = (
  process.env.VITE_ALLOWED_HOSTS ??
  process.env.ALLOWED_HOSTS ??
  ""
)
  .split(",")
  .map(host => host.trim())
  .filter(Boolean);

let analyticsConfigured = false;
const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  {
    name: "pathpilot-crawler-files",
    configResolved(config: import("vite").ResolvedConfig) {
      analyticsConfigured = Boolean(
        config.env.VITE_ANALYTICS_ENDPOINT &&
          config.env.VITE_ANALYTICS_WEBSITE_ID
      );
    },
    transformIndexHtml: {
      order: "pre" as const,
      handler(html: string) {
        return analyticsConfigured
          ? html
          : html.replace(
              /<script\s+defer\s+src="%VITE_ANALYTICS_ENDPOINT%\/umami"\s+data-website-id="%VITE_ANALYTICS_WEBSITE_ID%"><\/script>/,
              ""
            );
      },
    },
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/robots.txt" && req.url !== "/sitemap.xml")
          return next();
        res.setHeader(
          "Content-Type",
          req.url === "/robots.txt" ? "text/plain" : "application/xml"
        );
        res.end(req.url === "/robots.txt" ? robots(true) : sitemap());
      });
    },
  },
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    manifest: true,
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts:
      configuredAllowedHosts.length > 0
        ? configuredAllowedHosts
        : ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
