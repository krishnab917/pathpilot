import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock("../server/supabase", () => ({ currentSupabaseClient: () => mocks.client, getSupabaseConfig: () => ({ url: "https://example.supabase.co" }) }));

import { getPublicPortfolio, publishPortfolioProject, updatePortfolioProject } from "../server/db";

const userId = "11111111-1111-4111-8111-111111111111";
const portfolioProjectId = "22222222-2222-4222-8222-222222222222";

function mutationQuery(result: unknown) {
  const value = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
  value.update.mockReturnValue(value); value.eq.mockReturnValue(value); value.select.mockReturnValue(value); value.maybeSingle.mockResolvedValue(result);
  return value;
}

describe("portfolio publication repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a published entry to draft state whenever portfolio details are edited", async () => {
    const query = mutationQuery({ data: { id: portfolioProjectId, project_id: "33333333-3333-4333-8333-333333333333", title: "Garden tracker", summary: "A compact student project summary.", technologies: ["TypeScript"], repository_url: null, live_url: null, is_published: false, published_at: null, updated_at: "2026-08-17T00:00:00Z" }, error: null });
    mocks.client = { from: vi.fn(() => query) };

    await expect(updatePortfolioProject(userId, portfolioProjectId, { title: "Updated garden tracker" })).resolves.toMatchObject({ isPublished: false, publishedAt: null });
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ title: "Updated garden tracker", is_published: false, published_at: null }));
    expect(query.eq).toHaveBeenNthCalledWith(1, "id", portfolioProjectId);
    expect(query.eq).toHaveBeenNthCalledWith(2, "user_id", userId);
  });

  it("publishes only through an owner-scoped portfolio entry", async () => {
    const query = mutationQuery({ data: { id: portfolioProjectId, project_id: "33333333-3333-4333-8333-333333333333", title: "Garden tracker", summary: "A compact student project summary.", technologies: [], repository_url: null, live_url: null, is_published: true, published_at: "2026-08-17T00:00:00Z", updated_at: "2026-08-17T00:00:00Z" }, error: null });
    mocks.client = { from: vi.fn(() => query) };

    await expect(publishPortfolioProject(userId, portfolioProjectId)).resolves.toMatchObject({ isPublished: true });
    expect(query.eq).toHaveBeenNthCalledWith(1, "id", portfolioProjectId);
    expect(query.eq).toHaveBeenNthCalledWith(2, "user_id", userId);
  });

  it("does not return a public portfolio when the handle has no explicitly published projects", async () => {
    const profile = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    profile.select.mockReturnValue(profile); profile.eq.mockReturnValue(profile); profile.maybeSingle.mockResolvedValue({ data: { user_id: userId, handle: "student-work", display_name: "Student work", introduction: null, updated_at: "2026-08-17T00:00:00Z" }, error: null });
    const entries = { select: vi.fn(), eq: vi.fn(), order: vi.fn() };
    entries.select.mockReturnValue(entries); entries.eq.mockReturnValue(entries); entries.order.mockResolvedValue({ data: [], error: null });
    mocks.client = { from: vi.fn((table: string) => table === "portfolio_profiles" ? profile : entries) };

    await expect(getPublicPortfolio("student-work")).resolves.toBeNull();
    expect(entries.select).toHaveBeenCalledWith(expect.stringContaining("title, summary, technologies"));
    expect(entries.select).not.toHaveBeenCalledWith(expect.stringContaining("project_notes"));
  });
});
