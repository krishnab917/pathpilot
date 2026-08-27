# PathPilot Server-Side Rate Limits

## Scope and design

Checkpoint 65 protects **authenticated, expensive AI generation** only. The limiter runs after tRPC verifies the Supabase session and obtains `ctx.user.id`; it never accepts a client-supplied user identifier. It uses two Supabase tables plus security-definer functions callable only by the server-side service-role client, so limits remain shared across autoscaled application instances. The tables contain only HMAC-derived keys, action names, counters, and expiry timestamps—never raw student IDs, prompts, Mentor context, or credentials.

The first checkpoint deliberately leaves Supabase Auth, public reads, administrative source refreshes, and derived-analysis queue actions for the separately approved follow-on scope. Those surfaces have different identity and availability requirements and should not be protected by a one-size-fits-all rule.

| Protected operation | Burst budget | Daily budget | Identity | Why this preserves normal usage |
|---|---:|---:|---|---|
| Career Mentor | 8 requests / 2 minutes | 60 requests / day | Verified authenticated user | Supports a short planning conversation while bounding automated chat floods. |
| Project AI guidance | 5 requests / 5 minutes | 25 requests / day | Verified authenticated user | Allows iterative project coaching; valid cached guidance is returned before any budget is consumed. |
| Roadmap generation | 2 requests / 30 minutes | 6 requests / day | Verified authenticated user | Roadmaps are substantial planning artifacts and rapid regeneration is not normal use. |
| Profile Analysis | 2 requests / 30 minutes | 4 requests / day | Verified authenticated user | Analyses are expensive and a valid result newer than the profile is reused. |

## Response and failure behavior

An exceeded budget or an identical operation already in progress returns tRPC `TOO_MANY_REQUESTS` (**HTTP 429**) with a generic retry message and `Retry-After` response header. The message does not disclose limiter keys, infrastructure, stored counts, or any other student’s activity. The client can present this safe server message in its existing error area.

If the shared limiter cannot validate a request, expensive AI operations **fail closed** with a generic temporary-unavailable response. This avoids silently disabling cost protection when the backing store is unavailable. Low-cost reads are not covered by this first checkpoint and therefore remain independent of limiter availability.

## Duplicate and cached work

Before an AI request starts, a short shared lease is acquired using a server-generated HMAC of the verified user, action, and request fingerprint. A matching concurrent request is rejected with the same safe 429/retry behavior; leases are released in `finally` and expire after three minutes to avoid permanent locks after a process failure. This is complementary to existing client disabled states, not dependent on them.

Project guidance checks its existing validated cache before the limiter. Profile Analysis returns a valid five-career result if it is at least as new as the profile. In both cases, a reuse does not call the model and does not consume a generation budget.

## Privacy-safe observability and retention

Server logs record only the event class and fixed action/window label for a rejection, duplicate, or lease-release failure. Prompt text, Mentor context, user IDs, HMAC keys, tokens, and database errors are not logged. Window rows older than eight days and expired operation leases are deleted by the atomic server functions on subsequent protected traffic. The short data retention supports operational diagnosis without creating a long-lived student activity log.
