import { describe, expect, it, vi } from "vitest";
import { signOutAndNavigate } from "../client/src/lib/sign-out";

describe("signOutAndNavigate", () => {
  it("clears the session before returning the student to the sign-in route", async () => {
    const signOut = vi.fn(async () => undefined);
    const navigate = vi.fn();

    await signOutAndNavigate(signOut, navigate);

    expect(signOut).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/auth");
  });

  it("does not navigate when session sign-out fails", async () => {
    const signOut = vi.fn(async () => {
      throw new Error("Session could not be cleared");
    });
    const navigate = vi.fn();

    await expect(signOutAndNavigate(signOut, navigate)).rejects.toThrow("Session could not be cleared");
    expect(navigate).not.toHaveBeenCalled();
  });
});
