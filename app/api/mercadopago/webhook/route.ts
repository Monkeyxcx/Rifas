import { NextRequest, NextResponse } from "next/server";
import {
  mpPayment,
  verifyWebhookSignature,
  isTesting
} from "@/lib/mercadopago";
import { createClient } from "@/lib/supabase/server";
import type { PagoStatus, ReservaStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MPAction =
  | "payment.created"
  | "payment.updated"
  | "plan.created"
  | "subscription.created"
  | "subscription.updated"
  | "unknown";

type MPPayload = {
  action?: MPAction | string;
  api_version?: string;
  data?: {
    id?: string | number;
  };
  date_created?: string;
  id?: number;
  live_mode?: boolean;
  type?: string;
  user_id?: string | number;
};

type MPPayment = {
  id?: string | number;
  status?: PagoStatus | string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  net_received_amount?: number;
  fee_details?: Array<{ amount?: number; fee_payer?: string; type?: string }>;
  payment_method_id?: string;
  payment_type_id?: string;
  installments?: number;
  payer?: { email?: string; first_name?: string; last_name?: string };
  metadata?: Record<string, string | undefined>;
  date_approved?: string;
  date_created?: string;
  currency_id?: string;
  order?: { id?: string | number; type?: string };
};

function hasMercadoPagoCredentials(): boolean {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  return token.length > 0 && !token.includes("PLACEHOLDER");
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =======================================================================
// Mercado Pago Webhook — IMPORTANTE: siempre responder 2xx rápidamente
// para que MP no reintente 100+ veces. Procesamos como trabajo async best effort.
// =======================================================================
export async function POST(req: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch {
    rawBody = "";
  }

  // 1. Signature validation
  if (hasMercadoPagoCredentials() && process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    try {
      const signatureOk = await verifyWebhookSignature(req, rawBody);
      if (!signatureOk) {
        console.warn(
          "[mercadopago/webhook] FIRMA INVALIDA — request rechazado 401"
        );
        return NextResponse.json(
          { ok: false, error: "Signature invalida" },
          { status: 401 }
        );
      }
    } catch (err) {
      console.error("[mercadopago/webhook] error verificando firma", err);
      return NextResponse.json(
        { ok: false, error: "Signature validation error" },
        { status: 401 }
      );
    }
  } else {
    console.warn(
      "[mercadopago/webhook] credenciales MP / webhook secret sin setear — aceptando request sin validar (dev mode)."
    );
  }

  // 2. Parsear payload MP standard
  let payload: MPPayload = {};
  try {
    payload = rawBody.length ? (JSON.parse(rawBody) as MPPayload) : {};
  } catch {
    payload = {};
  }

  const action: MPAction | string = payload.action ?? "unknown";
  const paymentId =
    payload.data?.id?.toString() ??
    (req.nextUrl.searchParams.get("data.id") ||
      req.nextUrl.searchParams.get("id") ||
      "");

  if (action === "test" || !paymentId) {
    return NextResponse.json(
      { ok: true, received: true, action, payment_id: paymentId || null },
      { status: 200 }
    );
  }

  const isPaymentAction = action.startsWith("payment.");
  if (!isPaymentAction) {
    console.log(
      `[mercadopago/webhook] action ${action} no es de pago. ACK 200.`
    );
    return NextResponse.json(
      { ok: true, received: true, action, skipped: true },
      { status: 200 }
    );
  }

  // 3. Fetch payment details
  let payment: MPPayment | null = null;
  if (hasMercadoPagoCredentials()) {
    try {
      const mpResp = await mpPayment.get({
        id: paymentId
      } as unknown as Parameters<typeof mpPayment.get>[0]);
      payment = mpResp as unknown as MPPayment;
    } catch (err) {
      console.error(
        `[mercadopago/webhook] fallo al obtener pago ${paymentId}`,
        err
      );
    }
  } else {
    // MOCK MODE — simulamos approved para testing
    payment = {
      id: paymentId,
      status: "approved",
      external_reference:
        payload.data?.id?.toString() ??
        `rifa-00000000-0000-0000-0000-000000000001-${Date.now()}`,
      transaction_amount: 111240,
      net_received_amount: 107_902,
      fee_details: [{ amount: 3338, fee_payer: "collector", type: "ml_fee" }],
      payment_method_id: "visa",
      payment_type_id: "credit_card",
      installments: 1,
      payer: {
        email: "comprador@demo.rifascenter.com",
        first_name: "Comprador",
        last_name: "Demo"
      },
      metadata: {
        rifa_id: "00000000-0000-0000-0000-000000000001",
        reserva_id: "",
        numbers: "07,13,23,41,55,72",
        environment: isTesting() ? "TEST" : "MOCK",
        platform: "RifasCenter"
      },
      date_approved: new Date().toISOString(),
      currency_id: "COP"
    };
  }

  if (!payment) {
    return NextResponse.json(
      { ok: true, received: true, action, warning: "pago no encontrado" },
      { status: 200 }
    );
  }

  const status: PagoStatus =
    (payment.status as PagoStatus | undefined) ?? "pending";
  const externalReference = payment.external_reference ?? "";
  const rifaIdRaw =
    payment.metadata?.rifa_id ??
    (externalReference.match(/rifa-([0-9a-fA-F-]{8,})/) || [])[1] ??
    null;
  const reservaIdRaw =
    payment.metadata?.reserva_id ??
    (externalReference.match(/reserva-([0-9a-fA-F-]{8,})/) || [])[1] ??
    null;
  const numbersRaw = payment.metadata?.numbers ?? "";
  const numbers = numbersRaw
    .split(/[,\s|;]+/)
    .map((s) => s.trim())
    .filter((n) => /^\d{2}$/.test(n));
  const payerEmail = payment.payer?.email ?? null;
  const totalAmount = payment.transaction_amount ?? 0;
  const feeAmount =
    payment.fee_details?.reduce((acc, f) => acc + (f.amount ?? 0), 0) ??
    Math.round(totalAmount * 0.03);
  const netAmount = payment.net_received_amount ?? totalAmount - feeAmount;

  // 4. Supabase side-effects (best-effort; si falla, MP reintenta luego)
  let user_id: string | null = null;
  if (hasMercadoPagoCredentials() && rifaIdRaw) {
    try {
      const supabase = await createClient();

      // 4a. Buscar el user_id por las reservas si tenemos reserva_id
      if (reservaIdRaw) {
        const { data: reservaFound } = await (supabase
          .from("reservas") as unknown as {
          select: (cols: string) => {
            eq: (k: string, v: unknown) => Promise<{
              data?: Array<{ user_id?: string }> | null;
            }>;
          };
        })
          .select("user_id")
          .eq("id", reservaIdRaw);
        if (reservaFound && reservaFound[0]?.user_id) {
          user_id = reservaFound[0].user_id;
        }
      }

      // 4b. Fallback: si no tenemos reserva ni user, buscar por rifa + numbers + reserved
      if (!user_id && numbers.length && rifaIdRaw) {
        const { data: list } = await (supabase
          .from("reservas") as unknown as {
          select: (cols: string) => {
            eq: (k: string, v: unknown) => {
              in_: (k: string, vs: string[]) => {
                eq2: (k: string, v: unknown) => Promise<{
                  data?: Array<{ user_id?: string }> | null;
                }>;
              };
            };
          };
        })
          .select("user_id")
          .eq("rifa_id", rifaIdRaw)
          .in_("number", numbers)
          .eq2("status", "reserved");
        if (list && list[0]?.user_id) user_id = list[0].user_id;
      }

      // 4c. Insert Pago
      const pagoId = generateUUID();
      await (supabase.from("pagos") as unknown as {
        insert: (
          rows: Record<string, unknown> | Record<string, unknown>[]
        ) => Promise<unknown>;
      }).insert({
        id: pagoId,
        rifa_id: rifaIdRaw,
        user_id,
        reserva_id: reservaIdRaw,
        mercado_pago_payment_id: String(payment.id ?? ""),
        mercado_pago_preference_id: null,
        external_reference: externalReference || null,
        status,
        amount: totalAmount,
        fee_amount: feeAmount,
        net_received_amount: netAmount,
        payment_method: payment.payment_method_id ?? null,
        payment_type: payment.payment_type_id ?? null,
        installments: payment.installments ?? 1,
        payer_email: payerEmail,
        mercado_pago_raw: payment,
        paid_at: payment.date_approved ?? null
      } as Record<string, unknown>);

      // 4d. Si approved → actualizar reservas a paid
      if (status === "approved") {
        const newStatusPaid: ReservaStatus = "paid";
        if (reservaIdRaw) {
          await (supabase.from("reservas") as unknown as {
            update: (patch: Record<string, unknown>) => {
              eq: (k: string, v: unknown) => Promise<unknown>;
            };
          })
            .update({ status: newStatusPaid, updated_at: new Date().toISOString() })
            .eq("id", reservaIdRaw);
        } else if (rifaIdRaw && numbers.length) {
          // Por cada número, update status reserved → paid
          await Promise.all(
            numbers.map((n) =>
              (supabase.from("reservas") as unknown as {
                update: (patch: Record<string, unknown>) => {
                  eq: (k: string, v: unknown) => {
                    eq2: (k: string, v: unknown) => Promise<unknown>;
                  };
                };
              })
                .update({
                  status: newStatusPaid,
                  updated_at: new Date().toISOString()
                })
                .eq("rifa_id", rifaIdRaw)
                .eq2("number", n)
            )
          );
        }

        // 4e. INSERT Notificación type = pago_aprobado
        if (user_id) {
          await (supabase.from("notifications") as unknown as {
            insert: (row: Record<string, unknown>) => Promise<unknown>;
          }).insert({
            id: generateUUID(),
            user_id,
            rifa_id: rifaIdRaw,
            type: "pago_aprobado",
            title: "¡Pago aprobado! 🎉",
            message: `Tu pago por ${numbers.length} número${numbers.length === 1 ? "" : "s"} (${numbers.join(", ")}) fue aprobado exitosamente. Revisa mis rifas para ver tu ticket oficial.`,
            action_url: "/mis-rifas/participando",
            read_at: null,
            created_at: new Date().toISOString()
          } as Record<string, unknown>);
        }
      }
    } catch (err) {
      console.error(
        `[mercadopago/webhook] side-effects supabase fallaron pago ${payment.id} status=${status}`,
        err
      );
      // Respondemos 200 igual, MP no debe saber que falló. Crons reintentan luego.
    }
  } else {
    // MODE MOCK SIN SUPABASE: logueamos flujo exitoso para QA
    console.log(
      "[mercadopago/webhook] MOCK MODE — pago procesado sin Supabase:",
      JSON.stringify({
        status,
        payment_id: payment.id,
        rifa_id: rifaIdRaw,
        reserva_id: reservaIdRaw,
        numbers,
        amount: totalAmount,
        payer_email: payerEmail
      })
    );
  }

  return NextResponse.json(
    {
      ok: true,
      received: true,
      action,
      payment_id: paymentId,
      payment_status: status,
      testing: isTesting() || !hasMercadoPagoCredentials(),
      rifa_id: rifaIdRaw,
      reserva_id: reservaIdRaw,
      numbers,
      amount: totalAmount,
      fee: feeAmount,
      net: netAmount,
      side_effects: hasMercadoPagoCredentials()
        ? "attempted"
        : "skipped (mock mode)"
    },
    { status: 200 }
  );
}

// Health check endpoint — Mercado Pago a veces hace GET manual + smee forward
export async function GET(req: NextRequest) {
  const mode =
    req.nextUrl.searchParams.get("mode") ??
    req.nextUrl.searchParams.get("challenge");
  if (mode && /^[a-zA-Z0-9_-]{10,}$/.test(mode)) {
    return new NextResponse(mode as string, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }
  return NextResponse.json({
    ok: true,
    service: "mercadopago-webhook",
    ready: true,
    configured: hasMercadoPagoCredentials(),
    testing: isTesting(),
    has_webhook_secret:
      !!process.env.MERCADO_PAGO_WEBHOOK_SECRET &&
      !process.env.MERCADO_PAGO_WEBHOOK_SECRET.includes("PLACEHOLDER")
  });
}
