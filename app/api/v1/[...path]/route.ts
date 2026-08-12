import { NextResponse } from "next/server";

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const baseUrl = process.env.PATHPILOT_API_URL;
  if (!baseUrl) return NextResponse.json({ detail: "PathPilot API is not configured." }, { status: 503 });
  const { path } = await context.params;
  const incoming = new URL(request.url);
  const target = new URL(`/api/v1/${path.join("/")}`, baseUrl);
  target.search = incoming.search;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();
  const response = await fetch(target, { method, headers, body, cache: "no-store" });
  return new Response(response.body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
