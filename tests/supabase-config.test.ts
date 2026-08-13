import { describe, expect, it } from "vitest";

describe("configured Supabase public API", () => {
  it("accepts the configured public project credential", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(key).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key! },
    });

    expect(response.ok).toBe(true);
  });
});
