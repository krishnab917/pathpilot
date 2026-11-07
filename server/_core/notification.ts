import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Dispatches a project-owner notification to an owner-controlled webhook.
 * Returns `true` if the request was accepted, `false` when the webhook
 * cannot be reached. Validation errors
 * bubble up as TRPC errors so callers can fix the payload.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!ENV.ownerNotificationWebhookUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Owner notification webhook URL is not configured.",
    });
  }

  try {
    const headers: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
    };
    if (ENV.ownerNotificationWebhookSecret) {
      headers.authorization = `Bearer ${ENV.ownerNotificationWebhookSecret}`;
    }

    const response = await fetch(ENV.ownerNotificationWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ title, content }),
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      console.warn("[Notification] request rejected", { status: response.status });
      return false;
    }

    return true;
  } catch {
    console.warn("[Notification] request failed");
    return false;
  }
}
