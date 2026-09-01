import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ ok: true, received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, status: "webhook placeholder" });
}
