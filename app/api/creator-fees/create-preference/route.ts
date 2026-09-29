import { NextRequest, NextResponse } from "next/server";

import { syncCreatorFeeStateForRifa } from "@/lib/creator-fees";
import { createPreference, isTesting, resolvePublicSiteUrl } from "@/lib/mercadopago";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  rifa_id?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const rifaId = body.rifa_id?.trim();

  if (!rifaId) {
    return NextResponse.json({ ok: false, error: "rifa_id requerido" }, { status: 400 });
  }

  const authSb = await createClient();
  const sb = createServiceClient();

  const {
    data: { user },
    error: userErr
  } = await authSb.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const { data: rifaRaw, error: rifaErr } = await (sb.from("rifas") as any)
    .select("id, creator_id, title")
    .eq("id", rifaId)
    .maybeSingle();

  const rifa = rifaRaw as
    | {
        id: string;
        creator_id: string;
        title: string;
      }
    | null;

  if (rifaErr || !rifa) {
    return NextResponse.json({ ok: false, error: "Rifa no encontrada." }, { status: 404 });
  }

  if (rifa.creator_id !== user.id) {
    return NextResponse.json(
      { ok: false, error: "No puedes pagar la comisión de una rifa ajena." },
      { status: 403 }
    );
  }

  const feeState = await syncCreatorFeeStateForRifa(sb, rifaId);
  if (!feeState) {
    return NextResponse.json({ ok: false, error: "No se pudo calcular la comisión." }, { status: 500 });
  }

  if (!feeState.threshold_reached) {
    return NextResponse.json(
      {
        ok: false,
        error: `La comisión se habilita después de ${feeState.trigger_ticket_count} boletas vendidas.`,
        paid_tickets_count: feeState.paid_tickets_count
      },
      { status: 409 }
    );
  }

  if (feeState.charge_status === "approved") {
    return NextResponse.json(
      { ok: false, error: "La comisión de esta rifa ya fue pagada." },
      { status: 409 }
    );
  }

  const payerEmail = user.email ?? "";
  const payerName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Creador de la rifa";
  const [firstName, ...surnameParts] = String(payerName).split(" ");
  const surname = surnameParts.join(" ") || "RifasCenter";

  const baseUrl = resolvePublicSiteUrl();
  const backQs = new URLSearchParams({
    rifa_id: rifaId,
    fee: "creator",
    status: "approved"
  });
  const successUrl = `${baseUrl}/mis-rifas/creadas?${backQs.toString()}`;
  const pendingUrl = `${baseUrl}/mis-rifas/creadas?rifa_id=${encodeURIComponent(rifaId)}&fee=creator&status=pending`;
  const failureUrl = `${baseUrl}/mis-rifas/creadas?rifa_id=${encodeURIComponent(rifaId)}&fee=creator&status=failure`;

  const externalReference = `creator-fee-${rifaId}-${Date.now()}`;

  const pref = await createPreference({
    items: [
      {
        id: `creator-fee-${rifaId}`,
        title: `Comision RifasCenter · ${rifa.title}`,
        description: `Pago de comisión del 3% de la rifa después de ${feeState.trigger_ticket_count} boletas vendidas`,
        quantity: 1,
        unit_price: feeState.fee_amount,
        currency_id: "COP"
      }
    ],
    metadata: {
      payment_purpose: "creator_fee",
      rifa_id: rifaId,
      creator_id: user.id,
      platform: "RifasCenter"
    },
    externalReference,
    payer: {
      email: payerEmail,
      name: firstName || "Creador",
      surname
    },
    backUrls: {
      success: successUrl,
      pending: pendingUrl,
      failure: failureUrl
    },
    expires: true,
    expirationDateFrom: new Date(Date.now()).toISOString(),
    expirationDateTo: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  });

  const preferenceId = (pref as unknown as { id?: string }).id ?? null;
  const initPoint = (pref as unknown as { init_point?: string }).init_point ?? "";
  const sandboxInitPoint =
    (pref as unknown as { sandbox_init_point?: string }).sandbox_init_point ?? "";

  await (sb.from("creator_fee_charges") as any)
    .update({
      external_reference: externalReference,
      mercado_pago_preference_id: preferenceId
    })
    .eq("rifa_id", rifaId);

  return NextResponse.json(
    {
      ok: true,
      testing: isTesting(),
      init_point: initPoint,
      sandbox_init_point: sandboxInitPoint,
      preference_id: preferenceId,
      external_reference: externalReference,
      total_amount: feeState.fee_amount,
      fee_amount: feeState.fee_amount,
      paid_tickets_count: feeState.paid_tickets_count
    },
    { status: 201 }
  );
}
