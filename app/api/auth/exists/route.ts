// GET /api/auth/exists?email=foo@bar.com
// Devuelve { ok:true, exists:boolean, isMe:boolean }
// NO requiere autenticación (es pre-signup check). Usa service client.
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const email = (params.get("email") || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "email inválido", exists: false },
      { status: 400 }
    );
  }

  const sb = createServiceClient();
  // 1) public.profiles tiene el trigger del signup auth.users insert → RLS select_public ok
  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("id, email:email")
    .ilike("email", email)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json(
      { ok: false, error: "error buscando perfil", exists: false },
      { status: 500 }
    );
  }
  if (profile) {
    return NextResponse.json({ ok: true, exists: true, isMe: false });
  }

  // 2) Fallback: consultar auth.users via admin RPC no permitido. Sin embargo
  //    en el trigger on_auth_user_created se inserta profiles INMEDIATAMENTE.
  //    Si profiles no tiene row → el usuario NO existe. Retornamos false seguro.
  return NextResponse.json({ ok: true, exists: false, isMe: false });
}
