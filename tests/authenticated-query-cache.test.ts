import { QueryClient } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createAuthenticatedQueryCacheBoundary } from "../client/src/lib/authenticated-query-cache";

const bootstrapSource = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
const aiCacheSource = readFileSync(resolve(process.cwd(), "server/ai-result-cache.ts"), "utf8");

describe("authenticated React Query cache boundary", () => {
  it("retains private data for one stable authenticated identity", () => {
    const queryClient = new QueryClient();
    const boundary = createAuthenticatedQueryCacheBoundary();
    boundary.attach(queryClient);
    const queryKey = [["pathpilot", "dashboard", "get"], { type: "query" }];

    boundary.transition("user-a");
    queryClient.setQueryData(queryKey, { student: "A" });
    expect(boundary.transition("user-a")).toBe(false);
    expect(queryClient.getQueryData(queryKey)).toEqual({ student: "A" });
  });

  it("cancels and clears User A private queries on logout before User B can use the browser tab", () => {
    const queryClient = new QueryClient();
    const cancelQueries = vi.spyOn(queryClient, "cancelQueries");
    const clear = vi.spyOn(queryClient, "clear");
    const boundary = createAuthenticatedQueryCacheBoundary();
    boundary.attach(queryClient);
    const queryKey = [["pathpilot", "dashboard", "get"], { type: "query" }];

    boundary.transition("user-a");
    queryClient.setQueryData(queryKey, { student: "A private data" });
    expect(boundary.transition(null)).toBe(true);
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();

    boundary.transition("user-b");
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();
    expect(cancelQueries).toHaveBeenCalledTimes(2);
    expect(clear).toHaveBeenCalledTimes(2);
  });

  it("also clears private query state for a direct authenticated User A to User B transition", () => {
    const boundary = createAuthenticatedQueryCacheBoundary();
    const queryClient = new QueryClient({ defaultOptions: { queries: { queryKeyHashFn: boundary.queryKeyHashFn } } });
    boundary.attach(queryClient);
    const queryKey = [["pathpilot", "roadmap", "get"], { type: "query" }];

    boundary.transition("user-a");
    queryClient.setQueryData(queryKey, { targetCareer: "User A direction" });
    const userAQueryHash = boundary.queryKeyHashFn(queryKey);
    expect(boundary.transition("user-b")).toBe(true);
    expect(boundary.queryKeyHashFn(queryKey)).not.toBe(userAQueryHash);
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();
  });

  it("reuses a fresh same-user query once but performs an independent fetch after User B takes over", async () => {
    const boundary = createAuthenticatedQueryCacheBoundary();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { queryKeyHashFn: boundary.queryKeyHashFn, staleTime: 60_000 },
      },
    });
    boundary.attach(queryClient);
    const queryKey = [["pathpilot", "dashboard", "get"], { type: "query" }];
    const fetchDashboard = vi.fn().mockResolvedValue({ privateDirection: "current user only" });

    boundary.transition("user-a");
    await queryClient.fetchQuery({ queryKey, queryFn: fetchDashboard });
    await queryClient.fetchQuery({ queryKey, queryFn: fetchDashboard });
    expect(fetchDashboard).toHaveBeenCalledTimes(1);

    boundary.transition("user-b");
    await queryClient.fetchQuery({ queryKey, queryFn: fetchDashboard });
    expect(fetchDashboard).toHaveBeenCalledTimes(2);
  });

  it("cancels a late User A response so it cannot repopulate state after logout or an account change", async () => {
    const boundary = createAuthenticatedQueryCacheBoundary();
    const queryClient = new QueryClient({ defaultOptions: { queries: { queryKeyHashFn: boundary.queryKeyHashFn } } });
    boundary.attach(queryClient);
    const queryKey = [["pathpilot", "projects", "list"], { type: "query" }];
    boundary.transition("user-a");
    const userAQueryHash = boundary.queryKeyHashFn(queryKey);
    let resolvePendingQuery: ((value: { project: string }) => void) | undefined;
    const pending = queryClient.fetchQuery({
      queryKey,
      queryFn: () => new Promise<{ project: string }>(resolvePromise => {
        resolvePendingQuery = resolvePromise;
      }),
    });

    expect(queryClient.getQueryCache().get(userAQueryHash)).toBeDefined();
    boundary.transition("user-b");
    resolvePendingQuery?.({ project: "User A private project" });
    await expect(pending).rejects.toThrow("CancelledError");
    expect(queryClient.getQueryCache().get(userAQueryHash)).toBeUndefined();
  });

  it("subscribes the boundary to Supabase hydration and all later authentication events", () => {
    expect(bootstrapSource).toContain("hydrateSupabaseSession().then(session => {");
    expect(bootstrapSource).toContain("authenticatedQueryCache.transition(session?.user.id ?? null)");
    expect(bootstrapSource).toContain("supabase.auth.onAuthStateChange");
  });

  it("keeps the server AI cache owner-scoped instead of storing a global private response", () => {
    expect(aiCacheSource).toContain('.eq("user_id", userId)');
    expect(aiCacheSource).toContain("user_id: userId");
  });
});
