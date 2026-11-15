import { defineConfig } from "vitest/config";
import path from "path";
import { assertDisposableSupabase, liveSupabaseFiles } from "./tests/disposable-supabase";

const templateRoot = path.resolve(import.meta.dirname);
const runLive = process.env.RUN_SUPABASE_INTEGRATION === "1";
if (runLive) assertDisposableSupabase();

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    // Streamdown imports KaTeX CSS; transform it through Vite for SSR security tests.
    server: { deps: { inline: ["streamdown"] } },
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "tests/**/*.test.ts"],
    exclude: runLive ? [] : liveSupabaseFiles,
  },
});
