type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`/api/v1/${path.replace(/^\//, "")}`, { ...options, headers: { "content-type": "application/json", ...options.headers }, body: options.body ? JSON.stringify(options.body) : undefined });
  if (!response.ok) throw new Error((await response.json().catch(() => ({ detail: "Request failed." }))).detail ?? "Request failed.");
  return response.json() as Promise<T>;
}
