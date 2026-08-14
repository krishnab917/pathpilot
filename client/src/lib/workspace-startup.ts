export function shouldShowWorkspaceStartupFrame({
  authLoading,
  isAuthenticated,
  dashboardLoading,
}: {
  authLoading: boolean;
  isAuthenticated: boolean;
  dashboardLoading: boolean;
}) {
  return authLoading || (isAuthenticated && dashboardLoading);
}
