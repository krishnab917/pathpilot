const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

export function getAuthRedirectUrl(path = "/auth", origin = window.location.origin) {
  const applicationOrigin = new URL(origin);
  const url = new URL(path, applicationOrigin);
  const isLocalHttp = applicationOrigin.protocol === "http:" && localHosts.has(applicationOrigin.hostname);
  if (applicationOrigin.protocol !== "https:" && !isLocalHttp) throw new Error("Authentication redirects must use HTTPS outside local development.");
  if (url.origin !== applicationOrigin.origin) throw new Error("Authentication redirects must remain within the active application origin.");
  return url.toString();
}
