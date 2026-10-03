export function aiErrorMessage(error: unknown): string {
  const value = error as { message?: string; data?: { code?: string } } | null;
  if (value?.message?.startsWith("This request took too long.")) return "This is taking too long. Reload your saved results before retrying; the request may still finish. Your input has been kept.";
  switch (value?.data?.code) {
    case "UNAUTHORIZED": return "Please sign in again to continue. Your input has been kept.";
    case "TOO_MANY_REQUESTS": return "A request may already be running, or you’ve reached the request limit. Check your saved results and wait before trying again.";
    case "BAD_REQUEST":
    case "PRECONDITION_FAILED": return value.message || "Please check your profile and career selection before retrying.";
    default: return "We couldn’t finish this request. Your input has been kept. Check your saved results, then try again shortly.";
  }
}
