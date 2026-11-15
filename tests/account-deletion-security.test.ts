import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ deleteUser: vi.fn(), createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
vi.mock("../server/supabase", async original => ({
  ...await original<typeof import("../server/supabase")>(),
  getSupabaseConfig: () => ({ url: "https://database.invalid", key: "offline-public-test" }),
  getSupabaseServiceRoleKey: () => "offline-private-test",
}));
import { deleteStudentAccount } from "../server/db";
import { appRouter } from "../server/routers";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const context = { user: { id: owner, email: null, name: null, role: "user" as const }, supabase: {} as any, req: {} as any, res: {} as any };
describe("account deletion authorization and failure behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockReturnValue({ auth: { admin: { deleteUser: mocks.deleteUser } } });
    mocks.deleteUser.mockResolvedValue({ error: null });
  });
  it("requires a session and deliberate confirmation before any privileged call", async () => {
    await expect(appRouter.createCaller({ ...context, user: null }).pathpilot.account.delete({ confirmed: true })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(appRouter.createCaller(context).pathpilot.account.delete({ confirmed: false as true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("derives the target from validated context even if another user ID is supplied", async () => {
    await expect(appRouter.createCaller(context).pathpilot.account.delete({ confirmed: true, userId: other } as any)).resolves.toEqual({ deleted: true });
    expect(mocks.deleteUser).toHaveBeenCalledTimes(1);
    expect(mocks.deleteUser).toHaveBeenCalledWith(owner);
  });
  it("treats a missing Auth user as an idempotent completion", async () => {
    mocks.deleteUser.mockResolvedValue({ error: { code: "user_not_found", status: 404 } });
    await expect(deleteStudentAccount(owner)).resolves.toEqual({ deleted: true });
  });
  it("does not report success or expose details when Auth/cascade deletion fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.deleteUser.mockRejectedValue(new Error("PRIVATE_SENTINEL"));
    await expect(deleteStudentAccount(owner)).rejects.toThrow("We could not delete your account.");
    expect(JSON.stringify(log.mock.calls)).not.toContain("PRIVATE_SENTINEL");
    log.mockRestore();
  });
});
