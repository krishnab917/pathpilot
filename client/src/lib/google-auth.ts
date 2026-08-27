import { getAuthRedirectUrl } from "@/lib/auth-redirect";

const SAFE_APP_SECTIONS = new Set([
  "overview",
  "discovery",
  "roadmap",
  "goals",
  "mentor",
  "portfolio",
  "opportunities",
  "simulation",
]);

type GoogleOAuthStarter = {
  signInWithOAuth: (options: {
    provider: "google";
    options: { redirectTo: string };
  }) => Promise<{ error: Error | null }>;
};

type GoogleOAuthCallbackClient = {
  exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
  getSession: () => Promise<{ data: { session: unknown | null }; error: Error | null }>;
};

export function getSafePostAuthPath(candidate: string | null | undefined) {
  if (!candidate?.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return "/app";
  const [path, query = ""] = candidate.split("?", 2);
  if (path === "/app" || path === "/onboarding") return `${path}${query ? `?${query}` : ""}`;
  const section = path.match(/^\/app\/([^/]+)$/)?.[1];
  return section && SAFE_APP_SECTIONS.has(section) ? `${path}${query ? `?${query}` : ""}` : "/app";
}

export function getGoogleAuthRedirectUrl(next: string | null | undefined = "/app", origin?: string) {
  const callback = new URL(getAuthRedirectUrl("/auth/callback", origin));
  callback.searchParams.set("next", getSafePostAuthPath(next));
  return callback.toString();
}

export async function startGoogleOAuth(auth: GoogleOAuthStarter, next?: string | null, origin?: string) {
  const { error } = await auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getGoogleAuthRedirectUrl(next, origin) },
  });
  if (error) throw error;
}

export async function completeGoogleOAuthCallback(auth: GoogleOAuthCallbackClient, url = window.location.href) {
  const callbackUrl = new URL(url);
  const next = getSafePostAuthPath(callbackUrl.searchParams.get("next"));
  const hasProviderError = callbackUrl.searchParams.has("error") || new URLSearchParams(callbackUrl.hash.slice(1)).has("error");
  if (hasProviderError) return { ok: false as const, next };

  const code = callbackUrl.searchParams.get("code");
  if (code) {
    const { error } = await auth.exchangeCodeForSession(code);
    if (error) return { ok: false as const, next };
  }

  const { data, error } = await auth.getSession();
  return error || !data.session ? { ok: false as const, next } : { ok: true as const, next };
}
