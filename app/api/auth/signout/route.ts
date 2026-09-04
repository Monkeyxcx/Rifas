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
    const headers = new Headers();
    headers.set("Location", "/auth");
    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers
      }
    );
  } catch (e) {
    console.error("[auth/signout] failed", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
