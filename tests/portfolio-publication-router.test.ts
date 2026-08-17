import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";

const mocks = vi.hoisted(() => ({ createPortfolioDraftFromProject: vi.fn(), publishPortfolioProject: vi.fn(), getPublicPortfolio: vi.fn() }));
vi.mock("../server/db", async importOriginal => {
  const actual = await importOriginal<typeof import("../server/db")>();
  return { ...actual, createPortfolioDraftFromProject: mocks.createPortfolioDraftFromProject, publishPortfolioProject: mocks.publishPortfolioProject, getPublicPortfolio: mocks.getPublicPortfolio };
});

import { appRouter } from "../server/routers";

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const portfolioProjectId = "33333333-3333-4333-8333-333333333333";
const context: TrpcContext = { user: { id: userId, email: "student@example.com", name: "Student", role: "user" }, supabase: {} as NonNullable<TrpcContext["supabase"]>, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("portfolio publication router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createPortfolioDraftFromProject.mockResolvedValue({ id: portfolioProjectId, isPublished: false });
    mocks.publishPortfolioProject.mockResolvedValue({ id: portfolioProjectId, isPublished: true });
    mocks.getPublicPortfolio.mockResolvedValue(null);
  });

  it("creates a private portfolio draft only through the signed-in project owner", async () => {
    await expect(appRouter.createCaller(context).pathpilot.portfolio.createDraftFromProject({ projectId })).resolves.toMatchObject({ id: portfolioProjectId, isPublished: false });
    expect(mocks.createPortfolioDraftFromProject).toHaveBeenCalledWith(userId, projectId);
  });

  it("requires an explicit confirmed value before publishing", async () => {
    await expect(appRouter.createCaller(context).pathpilot.portfolio.publish({ id: portfolioProjectId, confirmed: true })).resolves.toMatchObject({ isPublished: true });
    expect(mocks.publishPortfolioProject).toHaveBeenCalledWith(userId, portfolioProjectId);
    await expect(appRouter.createCaller(context).pathpilot.portfolio.publish({ id: portfolioProjectId, confirmed: false as true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("uses a handle-only public lookup that has no user context", async () => {
    await expect(appRouter.createCaller({ ...context, user: null }).pathpilot.portfolio.public({ handle: "student-work" })).resolves.toBeNull();
    expect(mocks.getPublicPortfolio).toHaveBeenCalledWith("student-work");
  });
});
