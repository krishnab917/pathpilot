import { describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("sonner", () => ({ toast }));

import { notify } from "../client/src/lib/notifications";

describe("global action notifications", () => {
  it("routes successful saved-data feedback through the shared notifier", () => {
    notify.success("Project added to your portfolio.");
    expect(toast.success).toHaveBeenCalledWith("Project added to your portfolio.");
  });

  it("routes recoverable operation failures through the shared notifier", () => {
    notify.error("We could not save that update.");
    expect(toast.error).toHaveBeenCalledWith("We could not save that update.");
  });
});
