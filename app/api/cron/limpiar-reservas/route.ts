import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExpiredRow = {
  id: string;
  rifa_id: string;
  number: string;
  status: string;
  expires_at: string;
};

async function q<T = unknown>(
  prom: Promise<{ data: T | null; error: unknown }>
): Promise<T | null> {
  const { data, error } = await prom;
  if (error) throw error;
  return data;
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const received = req.headers.get("authorization")?.trim() || null;
  return _runJob(expected || null, received);
}

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const received = req.headers.get("authorization")?.trim() || null;
  return _runJob(expected || null, received);
}

/**
 * Protege el cron:
 * - Si CRON_SECRET NO está seteado (default Hobby): pasamos sin auth para que
 *   puedas crear el cron sin variables extra.
 * - Si CRON_SECRET ESTÁ seteado: Vercel envía `Authorization: Bearer <CRON_SECRET>`.
 *   Cualquier request sin ese header exacto retorna HTTP 401 Unauthorized.
 */
async function _runJob(
  expectedBearer: string | null,
  receivedHeader: string | null
) {
  if (expectedBearer) {
    const correct = `Bearer ${expectedBearer}`;
    if (!receivedHeader || receivedHeader !== correct) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Unauthorized. CRON_SECRET está definido; este endpoint requiere " +
            "el header `Authorization: Bearer <CRON_SECRET>` (Vercel lo envía " +
            "automáticamente si la variable existe en Environment Variables)."
        },
        { status: 401 }
      );
    }
  }

  try {
    const nowIso = new Date().toISOString();
    const supabase = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // ---- 1) SELECT antes: saber exactamente qué vamos a expirar.
    const antes = (await q<ExpiredRow[]>(
      sb
        .from("reservas")
        .select("id, rifa_id, number, status, expires_at")
        .eq("status", "reserved")
        .lt("expires_at", nowIso)
        .order("expires_at", { ascending: true })
    )) as ExpiredRow[] | null;

    const pendientes = antes ? antes.length : 0;
    const ids = antes ? antes.map((r) => r.id) : [];
    const rifaIds = antes
      ? Array.from(new Set(antes.map((r) => r.rifa_id)))
      : [];
    const sampleRows = antes
      ? antes.slice(0, 10).map((r) => ({
          id: r.id.slice(0, 8),
          rifa_id: r.rifa_id.slice(0, 8),
          number: r.number,
          expires_at: r.expires_at
        }))
      : [];

    // ---- 2) UPDATE status=expired WHERE status=reserved AND expires_at<NOW.
    //    Trigger `trg_sync_rifa_available` en DB actualiza AUTOMÁTICAMENTE
    //    rifas.available_numbers = total - (reserved+paid) tras cada row.
    let count = 0;
    let errUpdate: unknown = null;
    if (pendientes > 0) {
      try {
        const { count: rowsAffected, error } = await sb
          .from("reservas")
          .update({ status: "expired", updated_at: nowIso })
          .eq("status", "reserved")
          .lt("expires_at", nowIso);
        if (error) errUpdate = error;
        else count = typeof rowsAffected === "number" ? rowsAffected : pendientes;
      } catch (e) {
        errUpdate = e;
      }
    }

    if (errUpdate) {
      console.error("[cron/limpiar-reservas] UPDATE failed:", errUpdate);
      const msg = errUpdate instanceof Error ? errUpdate.message : String(errUpdate);
      return NextResponse.json(
        {
          ok: false,
          error: `Fallo al actualizar reservas expiradas: ${msg}`,
          ts: nowIso
        },
        { status: 500 }
      );
    }

    if (count > 0) {
      console.log(
        `[cron/limpiar-reservas] ✅ EXPIRED ${count} / ${pendientes} reservas. ` +
          `rifas afectadas: ${rifaIds.length}. ids sample: ${ids.slice(0, 5).map(i=>i.slice(0,8)).join(',')}`
      );
    } else {
      console.log(`[cron/limpiar-reservas] Nada que expirar. OK.`);
    }

    return NextResponse.json({
      ok: true,
      message:
        count > 0
          ? `Se expiraron ${count} reserva${count === 1 ? "" : "s"} vencida${
              count === 1 ? "" : "s"
            }. Los números fueron liberados y rifas.available_numbers actualizado por DB trigger trg_sync_rifa_available.`
          : "No se encontraron reservas vencidas para expirar.",
      ts: nowIso,
      count,
      ids,
      rifa_ids: rifaIds,
      sample_expired: sampleRows
    });
  } catch (err) {
    console.error("[cron/limpiar-reservas] FAIL:", err);
    const msg =
      err instanceof Error
        ? err.message
        : "Error desconocido en limpieza de reservas.";
    return NextResponse.json(
      { ok: false, error: msg, ts: new Date().toISOString() },
      { status: 500 }
    );
  }
}

