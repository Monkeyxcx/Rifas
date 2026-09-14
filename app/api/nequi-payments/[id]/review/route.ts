import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { syncCreatorFeeStateForRifa } from "@/lib/creator-fees";
import {
  getManualPaymentNotificationLabel
} from "@/lib/manual-payments";
import type { ManualPaymentMethodType } from "@/lib/types";

export const dynamic = "force-dynamic";

type Body = {
  status?: "approved" | "rejected";
  notes?: string;
};

export async function POST(req: NextRequest, { params }: any) {
  const id = params?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (body?.status !== "approved" && body?.status !== "rejected") {
    return NextResponse.json({ error: "status invalid" }, { status: 400 });
  }

  const authSb = await createClient();
  const sb = createServiceClient();

  const {
    data: { user },
    error: uErr
  } = await authSb.auth.getUser();
  if (uErr || !user)
    return NextResponse.json({ error: "no auth" }, { status: 401 });

  // Admin check (los admins también pueden aprobar/rechazar)
  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (pErr || !profile)
    return NextResponse.json({ error: "profile not found" }, { status: 403 });
  const isAdmin = Boolean((profile as any).is_admin);

  // Cargar voucher con rifa_id creator_id
  const { data: voucherRaw, error: vErr } = await (sb.from("nequi_payments") as any)
    .select(
      "id, rifa_id, user_id, payment_method_type, reserva_ids, numbers, amount, status, voucher_image_url"
    )
    .eq("id", id)
    .maybeSingle();
  const voucher = voucherRaw as
    | {
        id: string;
        rifa_id: string;
        user_id: string;
        payment_method_type: ManualPaymentMethodType;
        reserva_ids: string[] | null;
        numbers: string[] | null;
        amount: number | null;
        status: string;
        voucher_image_url: string | null;
      }
    | null;
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
  if (!voucher) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: rifaRaw, error: rErr } = await (sb.from("rifas") as any)
    .select("id, creator_id, number_price")
    .eq("id", voucher.rifa_id)
    .maybeSingle();
  const rifa = rifaRaw as
    | {
        id: string;
        creator_id: string;
        number_price: number;
      }
    | null;
  if (rErr || !rifa) return NextResponse.json({ error: "rifa not found" }, { status: 500 });

  const isCreator = rifa.creator_id === user.id;
  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "no permission" }, { status: 403 });
  }

  if (voucher.status !== "pending") {
    return NextResponse.json(
      { error: `ya fue marcado como ${voucher.status}` },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();
  const payloadUpdate: any = {
    status: body.status,
    reviewed_by: user.id,
    review_notes: (body.notes || "").trim().slice(0, 1000) || null,
    reviewed_at: nowIso
  };

  // Si APPROVED → marcar reservas asociadas como paid + row pago en tabla pagos
  if (body.status === "approved") {
    const reservaIds = Array.isArray(voucher.reserva_ids)
      ? voucher.reserva_ids.filter((r) => typeof r === "string")
      : [];

    if (!reservaIds.length) {
      return NextResponse.json(
        { error: "este comprobante no tiene reservas asociadas" },
        { status: 409 }
      );
    }

    const { data: reservaRowsRaw, error: reservasErr } = await (sb
      .from("reservas") as any)
      .select("id, rifa_id, user_id, number, status")
      .in("id", reservaIds);
    if (reservasErr) {
      return NextResponse.json({ error: reservasErr.message }, { status: 500 });
    }

    const reservaRows = (reservaRowsRaw || []) as Array<{
      id: string;
      rifa_id: string;
      user_id: string;
      number: string;
      status: string;
    }>;

    if (reservaRows.length !== reservaIds.length) {
      return NextResponse.json(
        { error: "faltan reservas asociadas para aprobar este comprobante" },
        { status: 409 }
      );
    }

    const invalidReserva = reservaRows.find(
      (r) =>
        r.user_id !== voucher.user_id ||
        r.rifa_id !== voucher.rifa_id ||
        !["reserved", "paid", "expired"].includes(r.status)
    );
    if (invalidReserva) {
      return NextResponse.json(
        {
          error:
            "las reservas asociadas no estan en un estado valido para aprobar este pago"
        },
        { status: 409 }
      );
    }

    const { data: updatedReservasRaw, error: reservasUpErr } = await (sb
      .from("reservas") as any)
      .update({ status: "paid" })
      .in("id", reservaIds)
      .in("status", ["reserved", "paid", "expired"])
      .select("id, number");
    if (reservasUpErr) {
      return NextResponse.json({ error: reservasUpErr.message }, { status: 500 });
    }

    const updatedReservas = (updatedReservasRaw || []) as Array<{
      id: string;
      number: string;
    }>;

    if (updatedReservas.length !== reservaIds.length) {
      return NextResponse.json(
        {
          error:
            "no fue posible marcar todas las reservas como pagadas; el comprobante no se aprobo"
        },
        { status: 409 }
      );
    }

    const { error: upErr } = await (sb.from("nequi_payments") as any)
      .update(payloadUpdate)
      .eq("id", id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const numbersArr = updatedReservas.map((r) => r.number);

    // Crear row pagos pago método 'nequi'
    try {
      const paymentMethodType = voucher.payment_method_type ?? "nequi";
      await (sb.from("pagos") as any).insert({
        rifa_id: voucher.rifa_id,
        user_id: voucher.user_id,
        reserva_id: (Array.isArray(voucher.reserva_ids) && voucher.reserva_ids[0]) || null,
        mercado_pago_payment_id: null,
        mercado_pago_preference_id: null,
        external_reference: `NEQUI-${voucher.id.slice(0, 12)}`,
        status: "approved",
        amount: Number(voucher.amount || 0),
        fee_amount: 0,
        net_received_amount: Number(voucher.amount || 0),
        payment_method:
          paymentMethodType === "nequi" ? "nequi" : "manual_bank_transfer",
        payment_type: paymentMethodType,
        installments: 1,
        payer_email: null,
        mercado_pago_raw: {
          manual_payment_id: voucher.id,
          voucher_image_url: voucher.voucher_image_url,
          payment_method_type: paymentMethodType
        },
        paid_at: nowIso
      });
    } catch (_pagoInsertErr) {
      // No fallamos por row en pagos; lo más importante es reservas paid.
    }
    // Notificación participante aprobado
    const paymentLabel = getManualPaymentNotificationLabel(
      voucher.payment_method_type ?? "nequi"
    );
    await (sb.from("notifications") as any).insert({
      user_id: voucher.user_id,
      rifa_id: voucher.rifa_id,
      type: "manual_payment_approved",
      title: "¡Pago manual aprobado!",
      message: `El creador de la rifa validó tu ${paymentLabel}. Tus números ${numbersArr.slice(0, 10).join(", ")} ya están confirmados como pagados.`,
      action_url: `/mis-rifas/participando`
    });
    await syncCreatorFeeStateForRifa(sb, voucher.rifa_id).catch(() => null);
  } else {
    const { error: upErr } = await (sb.from("nequi_payments") as any)
      .update(payloadUpdate)
      .eq("id", id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // Rejected: notificar
    const paymentLabel = getManualPaymentNotificationLabel(
      voucher.payment_method_type ?? "nequi"
    );
    await (sb.from("notifications") as any).insert({
      user_id: voucher.user_id,
      rifa_id: voucher.rifa_id,
      type: "manual_payment_rejected",
      title: "Tu comprobante no fue validado",
      message: `El creador no pudo validar tu ${paymentLabel}. ${
        body.notes ? `Nota: ${body.notes}.` : "Por favor revisa el comprobante y vuelve a enviarlo o contacta al creador."
      }`,
      action_url: `/rifas/${voucher.rifa_id}`
    });
  }

  return NextResponse.json({ ok: true, status: body.status });
}
