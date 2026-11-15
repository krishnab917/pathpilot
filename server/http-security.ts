import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import type { Request, RequestHandler } from "express";

export const API_BODY_LIMIT = 1024 * 1024;
export const WORKER_BODY_LIMIT = 4096;

export const securityHeaders: RequestHandler = (req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
  });
  if (req.path === "/api" || req.path.startsWith("/api/")) res.set("Cache-Control", "no-store");
  next();
};

export function clientAddress(req: Request) {
  // Vercel overwrites this header at its boundary. Never trust it on a direct Node host.
  const forwarded = process.env.VERCEL === "1" ? req.headers["x-forwarded-for"] : undefined;
  if (typeof forwarded === "string" && isIP(forwarded.trim())) return forwarded.trim();
  return req.socket.remoteAddress ?? "unknown";
}

/** A bounded per-process shield before parsing/auth. Shared paid-work quotas are separate. */
export function createIngressGuard(options: { maximum?: number; capacity?: number; now?: () => number } = {}): RequestHandler {
  const secret = randomBytes(32);
  const windows = new Map<string, { count: number; expires: number }>();
  // Shared school networks can launch many 10–25-operation workspaces together.
  const maximum = options.maximum ?? 2000;
  const capacity = options.capacity ?? 10_000;
  const now = options.now ?? Date.now;
  let lastSweep = 0;
  return (req, res, next) => {
    if (req.originalUrl.length > 16_384) {
      res.status(414).json({ error: { code: "URI_TOO_LONG", message: "Request URL is too long." } }); return;
    }
    const procedures = req.path.startsWith("/trpc/") ? req.path.slice(6).split(",").length : 1;
    if (procedures > 25) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Too many operations in one request." } }); return;
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.headers["sec-fetch-site"] === "cross-site") {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Cross-site request rejected." } }); return;
    }
    const timestamp = now();
    // No raw IP addresses are retained. Cleanup is bounded by capacity.
    if (timestamp - lastSweep >= 1000 || windows.size >= capacity) {
      windows.forEach((value, key) => { if (value.expires <= timestamp) windows.delete(key); });
      lastSweep = timestamp;
    }
    const key = createHmac("sha256", secret).update(clientAddress(req)).digest("hex");
    let window = windows.get(key);
    if (window && window.expires <= timestamp) { windows.delete(key); window = undefined; }
    if (!window && windows.size >= capacity) {
      res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Please try again shortly." } }); return;
    }
    if (!window) { window = { count: 0, expires: timestamp + 120_000 }; windows.set(key, window); }
    window.count += procedures;
    if (window.count > maximum) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((window.expires - timestamp) / 1000))));
      res.status(429).json({ error: { code: "TOO_MANY_REQUESTS", message: "Too many requests. Please try again shortly." } }); return;
    }
    next();
  };
}
