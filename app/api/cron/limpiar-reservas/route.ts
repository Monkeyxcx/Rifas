import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function q<T = unknown>(
  prom: Promise<{ data: T | null; error: unknown }>
): Promise<T | null> {
  const { data, error } = await prom;
  if (error) throw error;
  return data;
}

export async function GET() {
  try {
    const nowIso = new Date().toISOString();
    const supabase = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    type ExpiredRow = { id: string; rifa_id: string; number: string; status: string; expires_at: string };

    const updated = (await q<ExpiredRow[]>(
      sb
        .from("reservas")
        .update({ status: "expired", updated_at: nowIso })
        .eq("status", "reserved")
        .lt("expires_at", nowIso)
        .select("id, rifa_id, number, status, expires_at")
    )) as ExpiredRow[] | null;

    const count = updated ? updated.length : 0;
    const ids = updated ? updated.map((r) => r.id) : [];
    const rifaIds = updated ? Array.from(new Set(updated.map((r) => r.rifa_id))) : [];

    if (count > 0) {
      console.log(
        `[cron/limpiar-reservas] EXPIRED ${count} reservas. rifas afectadas:`,
        rifaIds.length,
        "ids sample:",
        ids.slice(0, 5)
      );
    } else {
      console.log(`[cron/limpiar-reservas] Nada que expirar. OK.`);
    }

    return NextResponse.json({
      ok: true,
      message: count > 0
        ? `Se expiraron ${count} reserva${count === 1 ? "" : "s"} vencida${count === 1 ? "" : "s"}.`
        : "No se encontraron reservas vencidas para expirar.",
      ts: nowIso,
      count,
      ids,
      rifa_ids: rifaIds
    });
  } catch (err) {
    console.error("[cron/limpiar-reservas] FAIL:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido en limpieza de reservas.";
    return NextResponse.json(
      { ok: false, error: msg, ts: new Date().toISOString() },
      { status: 500 }
    );
  }
}
