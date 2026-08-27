import { hashKey, type QueryClient, type QueryKey } from "@tanstack/react-query";

type SessionIdentity = string | null;

/**
 * Keeps browser-resident tRPC/React Query state scoped to one verified
 * Supabase identity. Server data remains user-scoped by RLS and request
 * context; this boundary removes stale client entries before another account
 * can query through the same browser tab.
 */
export function createAuthenticatedQueryCacheBoundary() {
  let currentIdentity: SessionIdentity = null;
  let initialized = false;
  let queryClient: Pick<QueryClient, "cancelQueries" | "clear"> | null = null;

  const queryKeyHashFn = (queryKey: QueryKey) =>
    hashKey(["pathpilot-session-v1", currentIdentity ?? "signed-out", queryKey]);

  return {
    queryKeyHashFn,
    attach(client: Pick<QueryClient, "cancelQueries" | "clear">) {
      queryClient = client;
    },
    transition(nextIdentity: SessionIdentity) {
      const identityChanged = initialized && currentIdentity !== nextIdentity;
      currentIdentity = nextIdentity;
      initialized = true;
      if (!identityChanged || !queryClient) return false;

      // Cancel first so an in-flight User A response cannot repopulate the
      // shared client after logout or a direct account switch.
      void queryClient.cancelQueries();
      queryClient.clear();
      return true;
    },
  };
}
