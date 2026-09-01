import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({
    ok: true,
    init_point: "https://www.mercadopago.com/mla/checkout/start?pref_id=PLACEHOLDER"
  });
}
