import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createRequestSupabase } from "../supabase";

export type PathPilotUser = { id: string; email: string | null; name: string | null; role: "user" | "admin" };

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: PathPilotUser | null;
  supabase: SupabaseClient | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: PathPilotUser | null = null;
  let supabase: SupabaseClient | null = null;

  try {
    const authorization = opts.req.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!token) throw new Error("Missing Supabase bearer token.");
    supabase = createRequestSupabase(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new Error("Invalid Supabase access token.");
    user = {
      id: data.user.id,
      email: data.user.email ?? null,
      name: typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : null,
      role: data.user.app_metadata?.role === "admin" ? "admin" : "user",
    };
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
    supabase = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    supabase,
  };
}
