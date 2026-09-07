import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// ======================================================
// GET /api/reservas/[reservaId]/status
// Polling endpoint usado por MPPaymentWatcherOverlay para
// detectar cuando el webhook de MP marcó la reserva como paid
// y evitar depender del auto_return/redirección automática de MP
// (que NO funciona en localhost testing sandbox).
// ======================================================
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reservaId: string }> }
) {
  try {
    const { reservaId } = await params;
    const uuidRe = /^[0-9a-fA-F-]{36}$/;
    if (!uuidRe.test(reservaId)) {
      return NextResponse.json(
        { ok: false, error: "reservaId invalido" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as unknown as any;

    const { data: userRows, error: uErr } = await sb.auth.getUser();
    if (uErr || !userRows?.user) {
      return NextResponse.json(
        { ok: false, error: "no-auth" },
        { status: 401 }
      );
    }
    const userId = userRows.user.id as string;

    // Reserva base (una row, un solo número)
    const { data: reserva, error: rErr } = await sb
      .from("reservas")
      .select("id,rifa_id,number,status,expires_at,user_id,created_at,updated_at")
      .eq("id", reservaId)
      .eq("user_id", userId)
      .maybeSingle();
    if (rErr || !reserva) {
      return NextResponse.json(
        { ok: false, error: "reserva no encontrada" },
        { status: 404 }
      );
    }
    type RRow = {
      id: string; rifa_id: string; number: string;
      status: "reserved" | "paid" | "cancelled" | "expired" | "refunded";
      expires_at: string; user_id: string; created_at: string; updated_at: string;
    };
    const r = reserva as RRow;

    // Pago relacionado (último)
    type PagoRow = {
      id?: string; mercado_pago_payment_id?: string | null;
      status?: string; amount?: number; fee_amount?: number;
      net_received_amount?: number; created_at?: string;
    };
    let lastPago: PagoRow | null = null;
    try {
      const { data: pagos } = await sb
        .from("pagos")
        .select("id,mercado_pago_payment_id,status,amount,fee_amount,net_received_amount,created_at")
        .eq("reserva_id", reservaId)
        .order("created_at", { ascending: false })
        .limit(5);
      const arr = (pagos ?? []) as unknown[];
      if (arr[0]) lastPago = arr[0] as PagoRow;
    } catch { /* ignore */ }

    // Rifa info básica
    type RifaBasic = { id: string; title: string; number_price: number };
    let rifa: RifaBasic | null = null;
    try {
      const { data: rifas } = await sb
        .from("rifas")
        .select("id,title,number_price,creator_id")
        .eq("id", r.rifa_id)
        .limit(1);
      const arr = (rifas ?? []) as unknown[];
      if (arr[0]) rifa = arr[0] as RifaBasic;
    } catch { /* ignore */ }

    // Números del mismo bundle (agrupación lógica)
    let numbersArr: string[] = [r.number];
    try {
      if (r.status === "paid") {
        const { data: rows } = await sb
          .from("reservas")
          .select("number")
          .eq("rifa_id", r.rifa_id)
          .eq("user_id", userId)
          .eq("status", "paid");
        const arr = (rows ?? []) as { number: string }[];
        if (arr.length) numbersArr = arr.map(x => x.number);
      } else {
        const since = new Date(new Date(r.created_at).getTime() - 10_000).toISOString();
        const until = new Date(new Date(r.created_at).getTime() + 10_000).toISOString();
        const { data: rows } = await sb
          .from("reservas")
          .select("number")
          .eq("rifa_id", r.rifa_id)
          .eq("user_id", userId)
          .gte("created_at", since)
          .lte("created_at", until);
        const arr = (rows ?? []) as { number: string }[];
        if (arr.length > 1) numbersArr = arr.map(x => x.number);
      }
    } catch { /* fallback single number */ }

    return NextResponse.json(
      {
        ok: true,
        reserva_id: r.id,
        rifa_id: r.rifa_id,
        rifa_title: rifa?.title ?? null,
        rifa_number_price: rifa?.number_price ?? null,
        status: r.status,
        expires_at: r.expires_at,
        numbers: numbersArr,
        pago: lastPago,
        ts: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[api/reservas/[id]/status] failed", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "internal"
      },
      { status: 500 }
    );
  }
}
