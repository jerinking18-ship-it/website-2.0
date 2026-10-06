import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type Context = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: Request, context: Context) {
  const { path } = await context.params;
  const url = new URL(request.url);
  const target = `${apiBase}/customer/${path.join("/")}${url.search}`;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload.data ?? payload, { status: response.status });
}

export async function GET(request: Request, context: Context) {
  return proxy(request, context);
}

export async function POST(request: Request, context: Context) {
  return proxy(request, context);
}

export async function PATCH(request: Request, context: Context) {
  return proxy(request, context);
}

export async function DELETE(request: Request, context: Context) {
  return proxy(request, context);
}
