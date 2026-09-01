import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Limpieza de reservas vencidas — placeholder",
    ts: new Date().toISOString()
  });
}
