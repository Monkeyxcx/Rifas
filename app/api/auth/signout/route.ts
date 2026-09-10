import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("[auth/signout] supabase warning", error.message);
    }
    // FIX B#10: Location header solo funciona con status 3xx. Como el
    // llamador usa fetch POST (no submit formulario), retornamos JSON 200
    // con redirect_to en el payload. El caller hace window.location.replace
    // client side para feedback inmediato.
    return NextResponse.json(
      {
        ok: true,
        redirect_to: "/auth",
        message: "Sesión cerrada exitosamente"
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[auth/signout] failed", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
