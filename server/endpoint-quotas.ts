import { TRPCError } from "@trpc/server";
import { operationLimiter } from "./operation-limits";
import { RateLimitExceededError } from "./rate-limit";
import type { Request } from "express";
import { clientAddress } from "./http-security";

type QuotaResponse = { setHeader?: (name: string, value: string) => unknown };
// Called explicitly inside individual validated/authorized handlers, never as
// blanket middleware. Failed admission must not reach the expensive operation.
async function admit(response: QuotaResponse, identity: string, action: "api:sensitive" | "api:read", maximum: number, seconds: number) {
  try { await operationLimiter.consume(identity, action, maximum, seconds); }
  catch (error) {
    if (error instanceof RateLimitExceededError) {
      response.setHeader?.("Retry-After", String(Math.max(1, Math.ceil(error.retryAfterSeconds))));
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests. Please try again shortly." });
    }
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Request protection is temporarily unavailable. Please try again shortly." });
  }
}

export function admitSourceRefresh(response: QuotaResponse) {
  // One application identity: neither administrator changes nor switching from
  // direct NASA refresh to the encompassing curated refresh creates a new cap.
  return admit(response, "source-refresh:application", "api:sensitive", 2, 1800);
}

export function admitDerivedSubmission(response: QuotaResponse, userId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) throw new TRPCError({ code: "UNAUTHORIZED" });
  return admit(response, `derived-submission:user:${userId.toLowerCase()}`, "api:sensitive", 10, 300);
}

export function admitOwnerNotification(response: QuotaResponse) {
  return admit(response, "owner-notification:application", "api:sensitive", 3, 1800);
}

export async function admitPublicDataRead(response: QuotaResponse, request: Request) {
  // Never key by a bearer/report token, portfolio handle, user input or user
  // agent. Unknown transports share a conservative bucket, not unlimited access.
  const address = request?.headers && request?.socket ? clientAddress(request) : "unknown";
  await admit(response, `public-data:ip:${address}`, "api:read", 120, 120);
  await admit(response, "public-data:application", "api:read", 600, 120);
}
