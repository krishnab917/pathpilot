import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("account deletion security boundary", () => {
  it("implements deleteStudentAccount in the database layer using the service-role client", () => {
    const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    expect(dbSource).toContain("export async function deleteStudentAccount(userId: string)");
    expect(dbSource).toContain("const admin = serviceClient();");
    expect(dbSource).toContain("await admin.auth.admin.deleteUser(userId);");
  });

  it("exposes the deletion procedure only through protectedProcedure with explicit confirmation", () => {
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers/pathpilot.ts"), "utf8");
    expect(routerSource).toContain("account: router({");
    expect(routerSource).toContain("delete: protectedProcedure.input(z.object({ confirmed: z.literal(true) }))");
    expect(routerSource).toContain(".mutation(({ ctx }) => deleteStudentAccount(ctx.user.id)),");
  });

  it("keeps the privileged deletion logic out of the browser source", () => {
    const workspaceSource = readFileSync(resolve(process.cwd(), "client/src/pages/Workspace.tsx"), "utf8");
    expect(workspaceSource).not.toContain("deleteUser");
    expect(workspaceSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    // Ensure it uses the tRPC procedure instead
    expect(workspaceSource).toContain("trpc.pathpilot.account.delete.useMutation");
  });
});
