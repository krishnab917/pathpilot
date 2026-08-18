import { describe, expect, it } from "vitest";
import {
  shouldCloseWorkspaceMobileNavigation,
  shouldWrapWorkspaceMobileNavigationFocus,
} from "../client/src/lib/mobile-navigation";

describe("workspace mobile navigation accessibility", () => {
  it("closes the navigation dialog only for Escape", () => {
    expect(shouldCloseWorkspaceMobileNavigation("Escape")).toBe(true);
    expect(shouldCloseWorkspaceMobileNavigation("Enter")).toBe(false);
  });

  it("wraps keyboard focus from the final control to the first and vice versa", () => {
    expect(
      shouldWrapWorkspaceMobileNavigationFocus({
        isShiftKey: false,
        isFirstFocused: false,
        isLastFocused: true,
      })
    ).toBe(true);
    expect(
      shouldWrapWorkspaceMobileNavigationFocus({
        isShiftKey: true,
        isFirstFocused: true,
        isLastFocused: false,
      })
    ).toBe(true);
    expect(
      shouldWrapWorkspaceMobileNavigationFocus({
        isShiftKey: false,
        isFirstFocused: true,
        isLastFocused: false,
      })
    ).toBe(false);
  });
});
