const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

export function getAuthRedirectUrl(path = "/auth", origin = window.location.origin) {
  const url = new URL(path, origin);
  const isLocalHttp = url.protocol === "http:" && localHosts.has(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) throw new Error("Authentication redirects must use HTTPS outside local development.");
  return url.toString();
}
