import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  status?: "approved" | "rejected";
  notes?: string;
};

export async function POST(req: NextRequest, { params }: any) {
  try {
    const id = params?.id as string | undefined;
    if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as Body;
    if (body?.status !== "approved" && body?.status !== "rejected") {
      return NextResponse.json({ error: "status invalid" }, { status: 400 });
    }

    const authSb = await createClient();
    const sb = createServiceClient();

    // Auth real del request via cookies; luego usamos service-role para writes
    const {
      data: { user },
      error: uErr
    } = await authSb.auth.getUser();
    if (uErr || !user)
      return NextResponse.json({ error: "no auth" }, { status: 401 });

    const { data: profile, error: pErr } = await sb
      .from("profiles")
      .select("id, is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (pErr || !profile || !(profile as any).is_admin) {
      return NextResponse.json({ error: "no admin" }, { status: 403 });
    }

    const payload: any = {
      status: body.status,
      review_admin_id: user.id,
      review_notes: (body.notes || "").trim().slice(0, 1000) || null,
      reviewed_at: new Date().toISOString()
    };

    const { data, error } = await (sb.from("user_nequi_verifications") as any)
      .update(payload)
      .eq("id", id)
      .select("id, status")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });

    // Insert notificación al usuario solicitante (lectura previa)
    const { data: origRaw } = await (sb.from("user_nequi_verifications") as any)
      .select("user_id")
      .eq("id", id)
      .maybeSingle();
    const orig = origRaw as { user_id: string } | null;
    if (orig?.user_id) {
      await (sb.from("notifications") as any).insert({
        user_id: orig.user_id,
        type: body.status === "approved" ? "nequi_approved" : "nequi_rejected",
        title:
          body.status === "approved"
            ? "¡Verificación Nequi aprobada!"
            : "Verificación Nequi requiere revisión",
        message:
          body.status === "approved"
            ? "Ya puedes habilitar pago por Nequi en tus rifas creadas."
            : `Un administrador rechazó tu verificación. Nota: ${
                body.notes || "revista los documentos y vuelve a enviarla."
              }`,
        action_url: "/perfil#verificacion-nequi",
        rifa_id: null
      });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server error" },
      { status: 500 }
    );
  }
}
