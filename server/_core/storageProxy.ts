import type { Express } from "express";
import { ENV } from "./env";

const encodeStorageKey = (key: string): string =>
  key
    .split("/")
    .filter(
      segment => segment.length > 0 && segment !== "." && segment !== ".."
    )
    .map(encodeURIComponent)
    .join("/");

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.storagePublicBaseUrl) {
      res.status(410).send("Storage compatibility backend is not configured");
      return;
    }

    try {
      const encodedKey = encodeStorageKey(key);
      if (!encodedKey) {
        res.status(400).send("Invalid storage key");
        return;
      }

      const url = new URL(
        encodedKey,
        ENV.storagePublicBaseUrl.replace(/\/+$/, "") + "/"
      );
      res.set("Cache-Control", "no-store");
      res.redirect(307, url.toString());
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
