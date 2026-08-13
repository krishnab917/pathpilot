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
