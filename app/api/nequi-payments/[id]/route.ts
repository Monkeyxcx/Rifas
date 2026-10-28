import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { syncCreatorFeeStateForRifa } from "@/lib/creator-fees";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// DELETE /api/nequi-payments/[id]
// Creador de la rifa (o admin): elimina un comprobante para rehacer el proceso.
//  - pending/rejected: borra el voucher. Las reservas reserved siguen vigentes
//    (el participante puede reenviar); las cancelled quedan libres.
//  - approved: revierte el pago — reservas paid->cancelled, borra la fila en
//    pagos y el voucher, resincroniza fee y notifica al participante.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });

  const authSb = await createClient();
  const sb = createServiceClient();
  const svc = sb as unknown as any;

  const {
    data: { user }
  } = await authSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  const { data: profile } = await svc
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = Boolean((profile as any)?.is_admin);

  const { data: voucherRaw } = await (svc.from("nequi_payments") as any)
    .select("id, rifa_id, user_id, reserva_ids, numbers, amount, status")
    .eq("id", id)
    .maybeSingle();
  const voucher = voucherRaw as
    | {
        id: string;
        rifa_id: string;
        user_id: string;
        reserva_ids: string[] | null;
        numbers: string[] | null;
        amount: number | null;
        status: string;
      }
    | null;
  if (!voucher) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: rifaRaw } = await (svc.from("rifas") as any)
    .select("id, creator_id")
    .eq("id", voucher.rifa_id)
    .maybeSingle();
  const isCreator =
    (rifaRaw as { creator_id?: string } | null)?.creator_id === user.id;
  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "no permission" }, { status: 403 });
  }

  const reservaIds = Array.isArray(voucher.reserva_ids)
    ? voucher.reserva_ids.filter((r) => typeof r === "string")
    : [];
  const nowIso = new Date().toISOString();

  if (voucher.status === "approved") {
    // 1. Liberar números: paid -> cancelled (solo los de este voucher)
    if (reservaIds.length) {
      const { error: resErr } = await (svc.from("reservas") as any)
        .update({ status: "cancelled", updated_at: nowIso })
        .in("id", reservaIds)
        .eq("rifa_id", voucher.rifa_id)
        .eq("user_id", voucher.user_id)
        .eq("status", "paid");
      if (resErr)
        return NextResponse.json({ error: resErr.message }, { status: 500 });
    }
    // 2. Borrar fila en pagos generada por este comprobante
    await (svc.from("pagos") as any)
      .delete()
      .eq("rifa_id", voucher.rifa_id)
      .eq("user_id", voucher.user_id)
      .eq("status", "approved")
      .eq("external_reference", `NEQUI-${voucher.id.slice(0, 12)}`);
    // 3. Borrar voucher (solo si no lo revirtió otro en paralelo)
    const { data: deleted, error: delErr } = await (svc
      .from("nequi_payments") as any)
      .delete()
      .eq("id", id)
      .in("status", ["approved", "pending", "rejected"])
      .select("id");
    if (delErr)
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    if (!deleted || (deleted as unknown[]).length === 0) {
      return NextResponse.json(
        { error: "el comprobante ya fue modificado por otro usuario" },
        { status: 409 }
      );
    }
    await (svc.from("notifications") as any).insert({
      user_id: voucher.user_id,
      rifa_id: voucher.rifa_id,
      type: "manual_payment_reverted",
      title: "Comprobante eliminado por el creador",
      message: `El creador eliminó tu comprobante aprobado (${(voucher.numbers || []).join(", ")}). Los números fueron liberados; si quieres participar, reserva de nuevo y envía otro comprobante.`,
      action_url: `/rifas/${voucher.rifa_id}`
    });
    await syncCreatorFeeStateForRifa(svc, voucher.rifa_id).catch(() => null);
  } else {
    // pending / rejected: borra el voucher; las reservas quedan como estén
    // (reserved siguen vigentes para reenviar, cancelled ya están libres).
    const { data: deleted, error: delErr } = await (svc
      .from("nequi_payments") as any)
      .delete()
      .eq("id", id)
      .in("status", ["pending", "rejected"])
      .select("id");
    if (delErr)
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    if (!deleted || (deleted as unknown[]).length === 0) {
      return NextResponse.json(
        { error: "el comprobante ya fue revisado por otro usuario" },
        { status: 409 }
      );
    }
    if (voucher.status === "pending") {
      await (svc.from("notifications") as any).insert({
        user_id: voucher.user_id,
        rifa_id: voucher.rifa_id,
        type: "manual_payment_reverted",
        title: "Tu comprobante fue descartado",
        message: `El creador descartó tu comprobante pendiente. Puedes enviar uno nuevo desde tu reserva vigente.`,
        action_url: `/mis-rifas/participando`
      });
    }
  }

  return NextResponse.json({ ok: true, deleted: id, was: voucher.status });
}
