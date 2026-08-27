import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import { createAuthenticatedQueryCacheBoundary } from "./lib/authenticated-query-cache";
import { pathpilotQueryDefaults } from "./lib/query-defaults";
import { getSupabaseAccessToken, hydrateSupabaseSession, supabase } from "./lib/supabase";
import "./index.css";

const authenticatedQueryCache = createAuthenticatedQueryCacheBoundary();
const queryClient = new QueryClient({
  defaultOptions: {
    ...pathpilotQueryDefaults,
    queries: {
      ...pathpilotQueryDefaults.queries,
      queryKeyHashFn: authenticatedQueryCache.queryKeyHashFn,
    },
  },
});
authenticatedQueryCache.attach(queryClient);

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        const token = getSupabaseAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const root = createRoot(document.getElementById("root")!);

root.render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
  </trpc.Provider>
);

void hydrateSupabaseSession().then(session => {
  authenticatedQueryCache.transition(session?.user.id ?? null);
});

supabase.auth.onAuthStateChange((_event, session) => {
  authenticatedQueryCache.transition(session?.user.id ?? null);
});
