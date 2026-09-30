import { afterEach, describe, expect, it, vi } from "vitest";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import { observable } from "@trpc/server/observable";
import superjson from "superjson";
import type { AppRouter } from "../server/routers";
import { aiRequestDeadlineLink } from "../client/src/lib/ai-request-deadline";

describe("AI tRPC mutation settlement (offline transport)", () => {
  afterEach(() => vi.useRealTimers());
  it("preserves successful AI results and clears the deadline", async () => {
    vi.useFakeTimers();
    const client = createTRPCClient<AppRouter>({ links: [
      aiRequestDeadlineLink(100),
      () => () => observable(observer => {
        observer.next({ result: { data: { reply: "Saved response" } } });
        observer.complete();
      }),
    ] });
    await expect(client.pathpilot.mentor.send.mutate({ content: "Test" })).resolves.toEqual({ reply: "Saved response" });
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not add a deadline to unrelated operations", async () => {
    vi.useFakeTimers();
    const client = createTRPCClient<AppRouter>({ links: [
      aiRequestDeadlineLink(100),
      () => () => observable(observer => {
        const timer = setTimeout(() => { observer.next({ result: { data: null } }); observer.complete(); }, 200);
        return () => clearTimeout(timer);
      }),
    ] });
    const result = client.auth.me.query();
    await vi.advanceTimersByTimeAsync(201);
    await expect(result).resolves.toBeNull();
  });
  it.each([401, 429, 500, 502, "html", "timeout"] as const)("leaves pending on %s", async status => {
    vi.useFakeTimers();
    const client = createTRPCClient<AppRouter>({ links: [
      aiRequestDeadlineLink(100),
      httpBatchLink({ url: "http://local.invalid/api/trpc", transformer: superjson,
        fetch: async () => {
          if (status === "timeout") return new Promise(() => {});
          if (status === "html") return new Response("<!doctype html>", { headers: { "content-type": "text/html" } });
          return Response.json([{ error: { json: { message: "Safe test error", code: -32603, data: { code: status === 401 ? "UNAUTHORIZED" : status === 429 ? "TOO_MANY_REQUESTS" : "INTERNAL_SERVER_ERROR", httpStatus: status } } } }], { status });
        },
      }),
    ] });
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: () => client.pathpilot.mentor.send.mutate({ content: "Offline test" }),
    });
    const result = expect(mutation.execute(undefined)).rejects.toBeDefined();
    expect(mutation.state.status).toBe("pending");
    await vi.advanceTimersByTimeAsync(101);
    await result;
    expect(mutation.state.status).toBe("error");
    queryClient.clear();
  });
});
