import { keepPreviousData } from "@tanstack/react-query";

/**
 * Immutable, non-personal metadata. This still lives only in the active
 * browser session because the authenticated cache boundary clears all query
 * state whenever the verified user changes.
 */
export const staticMetadataQueryOptions = {
  staleTime: 60 * 60_000,
  gcTime: 24 * 60 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

/** Query policy for quickly changing server-filtered catalog searches. */
export const opportunitySearchQueryOptions = {
  staleTime: 15_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: false,
  placeholderData: keepPreviousData,
  trpc: { abortOnUnmount: true },
} as const;
