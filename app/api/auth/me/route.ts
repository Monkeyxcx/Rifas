import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json(
        { ok: false, error: "No autenticado" },
        { status: 401 }
      );
    }
    return NextResponse.json({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name:
          (data.user.user_metadata?.full_name as string) ??
          (data.user.user_metadata?.display_name as string) ??
          null,
        phone:
          (data.user.user_metadata?.phone as string) ??
          data.user.phone ??
          null
      }
    });
  } catch (e) {
    console.error("[auth/me] probe failed", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
