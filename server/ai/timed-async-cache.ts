export type Clock = () => number;

export function createTimedAsyncCache<T>(load: () => Promise<T>, ttlMs: number, now: Clock = Date.now) {
  let cached: { value: T; expiresAt: number } | null = null;
  let inFlight: Promise<T> | null = null;

  return {
    async get() {
      if (cached && cached.expiresAt > now()) return cached.value;
      if (inFlight) return inFlight;
      inFlight = load().then(value => {
        cached = { value, expiresAt: now() + ttlMs };
        return value;
      }).finally(() => {
        inFlight = null;
      });
      return inFlight;
    },
  };
}
