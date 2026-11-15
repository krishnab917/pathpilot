/** Bounded HTML from a configured public source, with same-site HTTPS redirects only. */
export async function fetchSourceHtml(url: string, fetcher: typeof fetch = fetch) {
  const original = new URL(url);
  if (original.protocol !== "https:" || original.username || original.password) throw new Error("Invalid opportunity source.");
  const apex = original.hostname.replace(/^www\./, "");
  const allowed = new Set([apex, `www.${apex}`]);
  const signal = AbortSignal.timeout(10_000);
  let target = original;
  for (let hop = 0; hop <= 3; hop++) {
    const response = await fetcher(target.href, { headers: { Accept: "text/html,application/xhtml+xml" }, redirect: "manual", signal });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel().catch(() => undefined);
      if (!location || hop === 3) throw new Error("Opportunity source redirect failed.");
      target = new URL(location, target);
      if (target.protocol !== "https:" || !allowed.has(target.hostname) || target.username || target.password || target.port) throw new Error("Opportunity source redirect rejected.");
      continue;
    }
    if (!response.ok) { await response.body?.cancel().catch(() => undefined); throw new Error("Opportunity source could not be reached."); }
    if (!response.body) throw new Error("Opportunity source returned no content.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let size = 0, text = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2 * 1024 * 1024) throw new Error("Opportunity source exceeded its size limit.");
        text += decoder.decode(value, { stream: true });
      }
      return text + decoder.decode();
    } finally { await reader.cancel().catch(() => undefined); }
  }
  throw new Error("Opportunity source redirect failed.");
}
