import { describe, expect, it } from "vitest";

describe("configured Supabase server credential", () => {
  it("can access the authenticated admin endpoint without exposing the key", async () => {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(key).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: { apikey: key!, Authorization: `Bearer ${key!}` },
    });

    expect(response.ok).toBe(true);
  });
});
