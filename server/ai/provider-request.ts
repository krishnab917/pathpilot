export class ProviderRequestError extends Error {
  constructor(
    public readonly category: "timeout" | "http" | "network" | "invalid_response",
    public readonly status?: number,
  ) {
    super(`AI provider request failed (${category}${status ? `, HTTP ${status}` : ""}).`);
    this.name = "ProviderRequestError";
  }
}

// Includes headers, body consumption and retry waits. Leave time for validation
// and persistence within the existing serverless execution budget.
export const PROVIDER_TIMEOUT_MS = 40_000;
const backoffDelay = (attempt: number) => {
  const cap = 500 * 2 ** attempt;
  return cap / 2 + Math.random() * cap / 2;
};

export async function requestProviderJson(
  url: string,
  init: RequestInit,
  timeoutMs = PROVIDER_TIMEOUT_MS,
): Promise<unknown> {
  const controller = new AbortController();
  const started = Date.now();
  const budget = Math.max(1, Math.min(timeoutMs, PROVIDER_TIMEOUT_MS));
  let retryCount = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waitTimer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ProviderRequestError("timeout"));
    }, budget);
  });
  const wait = (ms: number) => new Promise<void>(resolve => {
    waitTimer = setTimeout(resolve, ms);
  });
  console.info("[AI provider] started");
  try {
    return await Promise.race([deadline, (async () => {
      for (let attempt = 0; attempt <= 4; attempt++) {
        if (controller.signal.aborted) throw new ProviderRequestError("timeout");
        let response: Response;
        try {
          response = await fetch(url, { ...init, signal: controller.signal });
        } catch {
          if (controller.signal.aborted) throw new ProviderRequestError("timeout");
          if (attempt === 4) throw new ProviderRequestError("network");
          retryCount++;
          await wait(backoffDelay(attempt));
          continue;
        }
        console.info("[AI provider] response", { status: response.status, retryCount, elapsedMs: Date.now() - started });
        if (response.ok) {
          try { return await response.json(); }
          catch { throw new ProviderRequestError(controller.signal.aborted ? "timeout" : "invalid_response"); }
        }
        // Never read/log an error body: it may echo private prompts or credentials.
        void response.body?.cancel().catch(() => undefined);
        const transient = response.status === 408 || response.status === 429 || response.status >= 500;
        if (!transient || attempt === 4) throw new ProviderRequestError("http", response.status);
        const retryAfter = response.headers.get("retry-after");
        const seconds = retryAfter === null ? NaN : Number(retryAfter);
        const requestedDelay = Number.isFinite(seconds) ? seconds * 1000 : retryAfter ? Date.parse(retryAfter) - Date.now() : 0;
        const delay = Math.max(backoffDelay(attempt), Number.isFinite(requestedDelay) ? requestedDelay : 0);
        // Do not ignore Retry-After or retry sooner than the provider permits.
        if (delay >= budget - (Date.now() - started)) throw new ProviderRequestError("http", response.status);
        retryCount++;
        await wait(delay);
      }
      throw new ProviderRequestError("network");
    })()]);
  } catch (error) {
    const safe = error instanceof ProviderRequestError ? error : new ProviderRequestError("network");
    console.warn("[AI provider] failed", { category: safe.category, status: safe.status, elapsedMs: Date.now() - started, retryCount });
    throw safe;
  } finally {
    clearTimeout(timer);
    clearTimeout(waitTimer);
    controller.abort();
  }
}
