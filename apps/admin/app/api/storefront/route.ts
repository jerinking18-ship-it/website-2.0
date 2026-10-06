import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function GET() {
  const response = await fetch(`${apiBase}/storefront`, { cache: "no-store" });
  const payload = await response.json();
  return NextResponse.json(payload.data ?? payload, { status: response.status });
}

export async function POST(request: Request) {
  await request.json().catch(() => ({}));
  const response = await fetch(`${apiBase}/storefront`, { cache: "no-store" });
  const payload = await response.json();
  return NextResponse.json(payload.data ?? payload, { status: response.status });
}
