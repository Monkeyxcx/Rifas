import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED = ["full_name", "display_name", "phone", "country", "bio"] as const;
type Allowed = (typeof ALLOWED)[number];

const MAX_LEN: Record<Allowed, number> = {
  full_name: 120,
  display_name: 60,
  phone: 30,
  country: 60,
  bio: 300
};

function sanitize(key: Allowed, v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (trimmed === "") return null;
  const max = MAX_LEN[key];
  return trimmed.slice(0, max);
}

export async function PATCH(req: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Cuerpo inválido" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData, error: uErr } = await supabase.auth.getUser();
    if (uErr || !userData?.user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }
    const uid = userData.user.id;

    const patch: Record<string, unknown> = {};
    for (const k of ALLOWED) {
      if (k in body) {
        patch[k] = sanitize(k, body[k]);
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: true, updated: 0 });
    }

    const final: Record<string, unknown> = {
      ...patch,
      updated_at: new Date().toISOString()
    };
    const table = supabase.from("profiles") as unknown as {
      update: (o: Record<string, unknown>) => {
        eq: (k: string, v: string) => Promise<{ error?: { message: string } }>;
      };
    };
    const { error: updErr } = await table.update(final).eq("id", uid);

    if (updErr) {
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, updated: Object.keys(patch).length });
  } catch (e) {
    console.error("[profiles/me] PATCH failed", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
