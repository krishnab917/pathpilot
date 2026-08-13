import { useEffect } from "react";
import { useSupabaseAuth } from "./useSupabaseAuth";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };

export function useAuth(options?: UseAuthOptions) {
  const { user, loading, error, signOut } = useSupabaseAuth();
  const isAuthenticated = Boolean(user);
  useEffect(() => {
    if (options?.redirectOnUnauthenticated && !loading && !isAuthenticated) window.location.assign(options.redirectPath ?? "/auth");
  }, [isAuthenticated, loading, options?.redirectOnUnauthenticated, options?.redirectPath]);
  return {
    user: user ? { id: user.id, name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user.email ?? "PathPilot student", email: user.email ?? null, role: user.app_metadata?.role === "admin" ? "admin" as const : "user" as const } : null,
    loading,
    error,
    isAuthenticated,
    refresh: async () => undefined,
    logout: signOut,
  };
}
