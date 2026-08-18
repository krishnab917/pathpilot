export function shouldCloseWorkspaceMobileNavigation(key: string) {
  return key === "Escape";
}

export function shouldWrapWorkspaceMobileNavigationFocus({
  isShiftKey,
  isFirstFocused,
  isLastFocused,
}: {
  isShiftKey: boolean;
  isFirstFocused: boolean;
  isLastFocused: boolean;
}) {
  return (isShiftKey && isFirstFocused) || (!isShiftKey && isLastFocused);
}
