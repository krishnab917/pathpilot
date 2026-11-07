import { randomBytes } from "node:crypto";

// Not a session/JWT signer: Supabase continues to verify access tokens itself.
// Preserve configured key bytes and v1 hash domains for existing quota identities.
const localSecret = randomBytes(32).toString("hex");
export class SecurityConfigurationError extends Error {
  constructor() {
    super("Request protection requires a private, random JWT_SECRET of at least 32 bytes, shared by all serving instances. Verify configuration before deployment.");
    this.name = "SecurityConfigurationError";
  }
}
export function isIsolatedTest() {
  return process.env.NODE_ENV === "test" && process.env.VITEST === "true" && !process.env.VERCEL && !process.env.VERCEL_ENV;
}
export function protectionSecret() {
  const value = process.env.JWT_SECRET;
  if (value !== undefined && value !== "") {
    if (Buffer.byteLength(value, "utf8") < 32 || value.trim() !== value || new Set(value).size < 12 || /(?:change.?me|placeholder|your[-_ ]|local-rate-limit-secret)/i.test(value)) throw new SecurityConfigurationError();
    return value;
  }
  if (!process.env.VERCEL && !process.env.VERCEL_ENV && ["development", "test"].includes(process.env.NODE_ENV ?? "")) return localSecret;
  throw new SecurityConfigurationError();
}
