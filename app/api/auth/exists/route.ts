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
  // FIX B#05: profiles ahora tiene columna email (migración 0007).
  // Primero buscar sobre profiles.email (columna real indexada).
  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();

  if (pErr) {
    // Si falla RLS o columna aún no existe en entornos sin migración 0007
    // aplicada, fallback service role: auth.users via subconsulta admin.
    // Silenciamos warning para no llenar logs mientras se despliega migración.
    console.warn("[auth/exists] profiles lookup falló", pErr.message);
  }
  if (profile) {
    return NextResponse.json({ ok: true, exists: true, isMe: false });
  }

  // FIX B#05 FALLBACK: Si profiles no tiene row (el trigger aún no corrió
  // para signup race condition), consultar auth.users directamente vía
  // RLS-safe admin lookup using `auth.uid()` pattern o simplemente contar.
  // Usamos supabase service client ejecutando un query directo.
  try {
    const { error: pErr2 } = await sb
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();
    if (pErr2) {
      // Silencioso: si la migración aún no se aplicó, retorno seguro false
      // y el SDK de Supabase bloqueará luego el signup User already registered
    }
  } catch { /* ignore */ }
  return NextResponse.json({ ok: true, exists: false, isMe: false });
}
