export async function retryValidatedGuidance<T>(
  request: (attempt: number) => Promise<unknown>,
  validate: (response: unknown) => T,
  attempts = 2,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return validate(await request(attempt));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Career guidance could not be validated.");
}

export class CareerGuidanceTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Career guidance timed out after ${Math.ceil(timeoutMs / 1000)} seconds.`);
    this.name = "CareerGuidanceTimeoutError";
  }
}

export async function withCareerGuidanceTimeout<T>(operation: Promise<T>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new CareerGuidanceTimeoutError(timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
