export async function signOutAndNavigate(signOut: () => Promise<void>, navigate: (path: string) => void) {
  await signOut();
  navigate("/auth");
}
