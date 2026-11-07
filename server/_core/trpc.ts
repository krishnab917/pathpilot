import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { createPublicSupabase, runWithSupabaseClient } from "../supabase";
import { traceAiRequest } from "../ai/request-timing";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message: error.code === "INTERNAL_SERVER_ERROR"
        ? "PathPilot could not complete this request. Please try again." : shape.message,
      data: { ...shape.data, stack: undefined },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
// Public portfolio reads still execute under anonymous RLS, never service_role.
export const publicDataProcedure = t.procedure.use(({ next }) =>
  runWithSupabaseClient(createPublicSupabase(), () => next()));

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  const user = ctx.user;
  const supabase = ctx.supabase;

  if (!user || !supabase) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return runWithSupabaseClient(supabase, () => next({ ctx: { ...ctx, user, supabase } }));
});

const aiTiming = t.middleware(async ({ ctx, path, next }) => {
  const operation = path === "pathpilot.mentor.send" ? "mentor" : path === "pathpilot.roadmap.generate" ? "roadmap" : null;
  return operation ? traceAiRequest(operation, ctx.requestTiming, ctx.res, next) : next();
});
export const protectedProcedure = t.procedure.use(aiTiming).use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
