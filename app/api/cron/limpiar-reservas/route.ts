import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getExpiredReservedReservationIds } from "@/lib/reservas/expire";

export const runtime = "nodejs";

export async function GET() {
  const now = new Date();
  const nowIso = now.toISOString();

  try {
    const supabase = createServiceClient();
    // Supabase's fluent update types collapse to `never` here with the generated
    // schema, so we keep the cast local to this cron handler.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data, error } = await sb
      .from("reservas")
      .select("id, status, expires_at")
      .eq("status", "reserved");

    if (error) {
      throw error;
    }

    const expiredReservationIds = getExpiredReservedReservationIds(
      (data ?? []) as Array<{ id: string; status: string; expires_at: string }>,
      now
    );

    if (expiredReservationIds.length === 0) {
      return NextResponse.json({
        ok: true,
        released_count: 0,
        checked_at: nowIso
      });
    }

    const { data: updatedRows, error: updateError } = await sb
      .from("reservas")
      .update({
        status: "expired",
        updated_at: nowIso
      })
      .in("id", expiredReservationIds)
      .eq("status", "reserved")
      .lt("expires_at", nowIso)
      .select("id");

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      ok: true,
      released_count: updatedRows?.length ?? 0,
      checked_at: nowIso
    });
  } catch (error) {
    console.error("[cron/limpiar-reservas] cleanup failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron liberar las reservas vencidas.",
        checked_at: nowIso
      },
      { status: 500 }
    );
  }
}
