import {
  isTesting,
  mpPayment,
  verifyWebhookSignature
} from "@/lib/mercadopago";
import { evaluateWebhookSecurity } from "./security";
import { createServiceClient } from "@/lib/supabase/server";
import type { PagoStatus, ReservaStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

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
  // B#23 FIX: En entornos NO productivos, si el payload trae campo "_mock" inline
  // (E2E testing / curl manual), bypassear la validación de firma HMAC y usar
  // el mock como payment autoritativo directamente para no requerir MP API.
  let payloadRawParsed: Record<string, unknown> | null = null;
  try {
    if (rawBody.length) payloadRawParsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    payloadRawParsed = null;
  }
  const isMockPayload =
    process.env.NODE_ENV !== "production" &&
    payloadRawParsed !== null &&
    typeof (payloadRawParsed as Record<string, unknown>)._mock === "object" &&
    (payloadRawParsed as Record<string, unknown>)._mock !== null;
  const hasMockInline = Boolean(isMockPayload);

  if (hasMockInline) {
    console.warn(
      "[mercadopago/webhook] MOCK INLINE _mock detectado (dev mode). Bypass HMAC signature validation."
    );
  }

  const webhookSecurity = evaluateWebhookSecurity({
    hasCredentials: hasMercadoPagoCredentials(),
    hasWebhookSecret:
      !!process.env.MERCADO_PAGO_WEBHOOK_SECRET &&
      !process.env.MERCADO_PAGO_WEBHOOK_SECRET.includes("PLACEHOLDER"),
    hasMockInline
  });

  if (webhookSecurity.mode === "verify_signature") {
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
  } else if (webhookSecurity.mode === "reject_missing_secret") {
    console.error(
      "[mercadopago/webhook] MERCADO_PAGO_WEBHOOK_SECRET faltante con credenciales MP activas — rechazando request para evitar procesar webhooks sin firma."
    );
    return NextResponse.json(
      { ok: false, error: "Webhook secret not configured" },
      { status: 500 }
    );
  } else if (webhookSecurity.mode === "skip_signature_in_mock_mode") {
    console.warn(
      "[mercadopago/webhook] credenciales MP / webhook secret sin setear — aceptando request sin validar (dev mode)."
    );
  }

  // 2. Parsear payload MP standard
  let payload: MPPayload = {};
  try {
    payload = payloadRawParsed !== null
      ? (payloadRawParsed as unknown as MPPayload)
      : (rawBody.length ? (JSON.parse(rawBody) as MPPayload) : {});
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
  const mockPayment = (payload as Record<string, unknown>)._mock as
    | MPPayment
    | undefined;
  // B#23 FIX: Si el request trae _mock inline (dev testing), LO USAMOS DIRECTAMENTE
  // como fuente de verdad SIN llamar mpPayment.get() ni requerir la API real.
  if (hasMockInline && mockPayment) {
    console.warn(
      `[mercadopago/webhook] usando _mock inline como payment ${paymentId ?? "inline"} E2E testing.`
    );
    payment = mockPayment;
  } else if (hasMercadoPagoCredentials()) {
    try {
      const mpResp = await mpPayment.get({
        id: paymentId
      } as unknown as Parameters<typeof mpPayment.get>[0]);
      payment = mpResp as unknown as MPPayment;
    } catch (err) {
      // FALLBACK E2E: si el payload trae _mock (pruebas e2e o webhook forwarding)
      // y el lookup real falla, usamos ese mock como payment autoritativo.
      if (mockPayment && typeof mockPayment === "object") {
        console.warn(
          `[mercadopago/webhook] mpPayment.get ${paymentId} falló, usando _mock body fallback (E2E testing).`
        );
        payment = mockPayment;
      } else {
        console.error(
          `[mercadopago/webhook] fallo al obtener pago ${paymentId}`,
          err
        );
      }
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
  const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  let rifaIdRaw: string | null =
    payment.metadata?.rifa_id ??
    (externalReference.match(/rifa-([0-9a-fA-F-]{8,})/) || [])[1] ??
    null;
  const reservaIdRaw: string | null =
    payment.metadata?.reserva_id ??
    (externalReference.match(/reserva-([0-9a-fA-F-]{8,})/) || [])[1] ??
    (UUID_RE.test(externalReference) ? externalReference : null) ??
    null;
  const numbersRaw =
    payment.metadata?.numbers ??
    (Array.isArray((payment.metadata as unknown as { numbers?: string[] })?.numbers)
      ? (payment.metadata as unknown as { numbers: string[] }).numbers.join(",")
      : "");
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

  // ==============================================
  // B#26: Variables trazabilidad side-effects (scope for final response JSON)
  // Declarado ANTES del if hasMercadoPagoCredentials() para referenciar en el
  // response JSON que está en el ámbito función (fuera de condicionales).
  // ==============================================
  let sideEffectsOk = true as boolean;
  let sideEffectsErrMsg: string | undefined = undefined;
  let errCodePostgres: string | undefined = undefined;
  let pgConstraintName: string | undefined = undefined;
  // Postgres SQLSTATE NON-TRANSIENT: 200 OK MP NO reintenta webhook
  const PG_NON_TRANSIENT_CODES = new Set([
    "23505","23502","23503","23514","22P02","42601","42703","42P01"
  ]);
  // TRANSIENT: 500 => MP sí reintenta con backoff (conexión, timeout, DB restart)
  const PG_TRANSIENT_CODES = new Set([
    "53300","53400","57P01","57014","08000","08003","08006","57P02","57P03","58030"
  ]);
  let httpStatusOverride: 200 | 500 = 200;
  let alreadyProcessed = false;
  let rifaCancelledNoId = false;

  // 4. Supabase side-effects (best-effort; si falla con transient => MP retry 500)
  let user_id: string | null = null;
  if (hasMercadoPagoCredentials() && (rifaIdRaw || reservaIdRaw)) {
    try {
      const supabase = createServiceClient();
      type SbRow = Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as unknown as any;

      async function q<T = unknown>(
        prom: Promise<{ data: T | null; error: unknown }>
      ): Promise<T | null> {
        const { data, error } = await prom;
        if (error) throw error;
        return data;
      }

      type ReservaLookupRow = SbRow & {
        user_id?: string; rifa_id?: string; number?: string;
      };

      // 4z. Resolver user_id directamente desde metadata.user_id (para mocks o
      // integraciones donde ya sabemos el user sin necesidad de lookup DB).
      if (!user_id &&
          payment &&
          typeof (payment as unknown as {metadata?: unknown}).metadata === "object" &&
          (payment as unknown as {metadata?: {user_id?: unknown}}).metadata !== null) {
        const md = (payment as unknown as {metadata: {user_id?: unknown}}).metadata;
        if (typeof md.user_id === "string" && /^[0-9a-fA-F-]{36}$/.test(md.user_id)) {
          user_id = md.user_id;
        }
      }

      // 4a. Resolver rifa_id + user_id desde reserva_id si falta alguno
      if (reservaIdRaw && (!rifaIdRaw || !user_id)) {
        const reservaRow = (await q<ReservaLookupRow[]>(
          sb
            .from("reservas")
            .select("user_id, rifa_id, number")
            .eq("id", reservaIdRaw)
        )) as ReservaLookupRow[] | null;
        if (reservaRow && reservaRow[0]) {
          if (!user_id && reservaRow[0].user_id) user_id = reservaRow[0].user_id;
          if (!rifaIdRaw && reservaRow[0].rifa_id)
            rifaIdRaw = reservaRow[0].rifa_id as string;
        }
      }

      // 4b. Buscar user_id por reservas (rifa + numbers reserved)
      if (!user_id && numbers.length && rifaIdRaw) {
        const list = (await q<ReservaLookupRow[]>(
          sb
            .from("reservas")
            .select("user_id")
            .eq("rifa_id", rifaIdRaw)
            .in("number", numbers)
            .eq("status", "reserved")
        )) as ReservaLookupRow[] | null;
        if (list && list[0]?.user_id) user_id = list[0].user_id;
      }

      if (!rifaIdRaw) {
        rifaCancelledNoId = true;
        console.warn("[mercadopago/webhook] sin rifa_id resoluble — side-effects cancelados.");
      } else if (!user_id) {
        // FIX B#06: user_id no resuelto después de todos los fallbacks (metadata,
        // reserva_id lookup, rifa+numbers reserved). FK pagos.user_id NOT NULL
        // → INSERT fallaría 23502. Retornamos 500 TRANSIENTE para que MP REINTENTE
        // (la ventana de gracia de reserva aún puede estar abierta / nuevo lookup
        //  podría encontrar user_id si se completó race condition).
        sideEffectsOk = false;
        sideEffectsErrMsg = `user_id irresoluble pago=${payment.id} rifa=${rifaIdRaw} numbers=${numbers.join(",")}`;
        httpStatusOverride = 500;
        console.error(
          `[mercadopago/webhook] B#06 user_id SIN RESOLVER pago=${payment.id}. HTTP 500 MP RETRY. numbers=${numbers.join(",")}`
        );
      } else {
        try {
          // FIX B#31: Si reservaIdRaw no resolvió (sintético no match), pero sí
          // tenemos user_id + rifa + numbers, buscamos el id de reserva REAL
          // para insertarlo en pagos.reserva_id (ahora FK dropeada en 0005, pero
          // ayuda a polling y al JOIN del Bug#08 rollback histórico).
          let reservaIdRealParaPagos: string | null = reservaIdRaw;
          if ((!reservaIdRealParaPagos || !/^[0-9a-fA-F-]{36}$/.test(reservaIdRealParaPagos)) && numbers.length) {
            const row = (await q<ReservaLookupRow[]>(
              sb
                .from("reservas")
                .select("id")
                .eq("rifa_id", rifaIdRaw)
                .eq("user_id", user_id as string)
                .in("number", numbers)
                .eq("status", "reserved")
                .limit(1)
            )) as ReservaLookupRow[] | null;
            if (row && row[0]?.id) reservaIdRealParaPagos = row[0].id as string;
          }

          // 4c. Insert Pago (siempre — approved o no, para trazabilidad)
          const pagoId = generateUUID();
          const pagoRow = {
            id: pagoId,
            rifa_id: rifaIdRaw,
            user_id,
            reserva_id: reservaIdRealParaPagos,
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
          };
          await q(sb.from("pagos").insert(pagoRow));

          const nowIso = new Date().toISOString();

          // ================================================================
          // 4d. SIDE EFFECTS por status de pago
          //     - approved  → reservas.status = 'paid' (vendido)
          //     - rejected | cancelled | charged_back | refunded | expired
          //                 → reservas.status = 'cancelled' (libera números)
          //     - pending / in_process / in_mediation → NADA, esperamos
          //       expires_at o próximo webhook.
          // Trigger trg_sync_rifa_available actualiza available_numbers SOLO.
          // ================================================================
          const FINAL_APPROVED = new Set(["approved"]);
          const FINAL_REJECTED = new Set([
            "rejected",
            "cancelled",
            "charged_back",
            "refunded",
            "expired"
          ]);

          if (rifaIdRaw && numbers.length) {
            if (FINAL_APPROVED.has(status as string)) {
              const newStatusPaid: ReservaStatus = "paid";
              // FIX B#03: filtros user_id + status=reserved para NO actualizar
              // reservas expiradas/canceladas de OTROS usuarios que recompraron
              // los mismos números. Integridad de datos.
              await q(
                sb
                  .from("reservas")
                  .update({ status: newStatusPaid, updated_at: nowIso })
                  .eq("rifa_id", rifaIdRaw)
                  .in("number", numbers)
                  .eq("user_id", user_id as string)
                  .eq("status", "reserved")
              );

              // 4e. Notificación pago_aprobado
              if (user_id) {
                const notiRow = {
                  id: generateUUID(),
                  user_id,
                  rifa_id: rifaIdRaw,
                  type: "pago_aprobado",
                  title: "¡Pago aprobado! 🎉",
                  message: `Tu pago por ${numbers.length} número${numbers.length === 1 ? "" : "s"} (${numbers.join(", ")}) fue aprobado exitosamente. Revisa mis rifas para ver tu ticket oficial.`,
                  action_url: "/mis-rifas/participando",
                  read_at: null,
                  created_at: nowIso
                };
                await q(sb.from("notifications").insert(notiRow));
                console.log(
                  `[mercadopago/webhook] side-effects OK pago id=${payment.id} status=approved pagos.pago_id=${pagoId}`
                );
              }
            } else if (FINAL_REJECTED.has((status as string).toLowerCase())) {
              // Pago rechazado/finalizado mal → LIBERAR los números status='reserved'
              // de ESTE usuario (NO tocar reservas de otros con mismo number).
              const newStatusCancel: ReservaStatus = "cancelled";
              await q(
                sb
                  .from("reservas")
                  .update({ status: newStatusCancel, updated_at: nowIso })
                  .eq("rifa_id", rifaIdRaw)
                  .in("number", numbers)
                  .eq("user_id", user_id as string)
                  .eq("status", "reserved")
              );

              if (user_id) {
                const notiRow = {
                  id: generateUUID(),
                  user_id,
                  rifa_id: rifaIdRaw,
                  type: "pago_rechazado",
                  title: "Pago no aprobado",
                  message: `Tu pago por ${numbers.length} número${numbers.length === 1 ? "" : "s"} (${numbers.join(", ")}) no fue aprobado. Los números fueron liberados — vuelve a seleccionar y pagar para reservarlos de nuevo.`,
                  action_url: `/rifas/${rifaIdRaw}?numbers=${numbers.join(",")}`,
                  read_at: null,
                  created_at: nowIso
                };
                await q(sb.from("notifications").insert(notiRow)).catch(() => null);
                console.log(
                  `[mercadopago/webhook] side-effects OK pago id=${payment.id} status=${status} reservas cancelled ${numbers.length} nros.`
                );
              }
            } else {
              console.log(
                `[mercadopago/webhook] status=${status} NO final — NINGÚN side-effect sobre reservas. Espera próximo webhook o expires_at.`
              );
            }
          }
        } catch (err) {
          // B#26: catch de los side-effects DB con clasificación de error
          sideEffectsOk = false;
          const errObj = err as {
            code?: string; message?: string; constraint?: string;
            details?: string; error?: string;
          };
          errCodePostgres = errObj.code;
          pgConstraintName = errObj.constraint;
          sideEffectsErrMsg = errObj.message ?? errObj.error ?? String(err);

          const is23505 = errCodePostgres === "23505";
          const isPagoDuplicateUnique = is23505 &&
            (pgConstraintName === "pagos_mercado_pago_payment_id_key" ||
              (typeof sideEffectsErrMsg === "string" &&
                sideEffectsErrMsg.toLowerCase().includes("mercado_pago_payment_id")));

          if (isPagoDuplicateUnique) {
            // Pago ya procesado en webhook anterior (duplicate delivery)
            alreadyProcessed = true;
            sideEffectsOk = true;
            sideEffectsErrMsg = undefined; // No hubo error funcional, ya estaba OK antes
            httpStatusOverride = 200;
            console.warn(
              `[mercadopago/webhook] B#26 duplicate delivery pago ${payment.id} (23505 ${pgConstraintName}). 200 + already_processed:true.`
            );
          } else if (is23505) {
            // Otra unique violation (no duplicate payment_id)
            httpStatusOverride = 200;
            console.error(
              `[mercadopago/webhook] B#26 23505 unique constraint=${pgConstraintName} pago ${payment.id}. 200 side_effects:failed.`,
              err
            );
          } else if (errCodePostgres && PG_TRANSIENT_CODES.has(errCodePostgres)) {
            // Error transitorio DB => 500 para que MP RETRY webhook
            httpStatusOverride = 500;
            console.error(
              `[mercadopago/webhook] B#26 TRANSIENT code=${errCodePostgres} pago ${payment.id}. HTTP 500 MP retry.`,
              err
            );
          } else if (errCodePostgres && PG_NON_TRANSIENT_CODES.has(errCodePostgres)) {
            // Error no transitorio (null, FK, syntax, check) => 200 failed NO retry
            httpStatusOverride = 200;
            console.error(
              `[mercadopago/webhook] B#26 NON-TRANSIENT code=${errCodePostgres} pago ${payment.id}. 200 side_effects:failed.`,
              err
            );
          } else {
            // Otros errores desconocidos
            httpStatusOverride = 200;
            console.error(
              `[mercadopago/webhook] B#26 UNKNOWN error pago ${payment.id} status=${status}.`,
              err
            );
          }
        }
      }
    } catch (outerErr) {
      // B#26 OUTER catch: excepciones fuera del inner side-effects try
      // (ej: createServiceClient no exporta, auth.getUser falla, etc)
      sideEffectsOk = false;
      const outerObj = outerErr as { code?: string; message?: string; error?: string };
      errCodePostgres = outerObj.code ?? undefined;
      sideEffectsErrMsg = outerObj.message ?? outerObj.error ?? String(outerErr);
      httpStatusOverride = 200;
      console.error(
        `[mercadopago/webhook] B#26 OUTER wrapper side-effects falló (fuera inner try). code=${errCodePostgres ?? "none"}.`,
        outerErr
      );
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

  // B#26: Calcular side_effects final string status
  let sideEffectsLabel: string;
  if (!hasMercadoPagoCredentials()) {
    sideEffectsLabel = "skipped (mock mode)";
  } else if (rifaCancelledNoId) {
    sideEffectsLabel = "cancelled (missing rifa_id)";
  } else if (alreadyProcessed) {
    sideEffectsLabel = "completed (already_processed duplicate webhook delivery)";
  } else if (sideEffectsOk) {
    sideEffectsLabel = "completed";
  } else {
    sideEffectsLabel = "failed";
  }
  // Status HTTP final: transient => 500 retry, otherwise 200
  const finalStatus: 200 | 500 = httpStatusOverride;

  return NextResponse.json(
    {
      ok: finalStatus === 200,
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
      side_effects: sideEffectsLabel,
      side_effects_success: hasMercadoPagoCredentials()
        ? sideEffectsOk
        : true,
      side_effects_error: sideEffectsErrMsg ?? undefined,
      already_processed: alreadyProcessed,
      _b26_diag:
        process.env.NODE_ENV !== "production"
          ? { err_pg_code: errCodePostgres ?? null, pg_constraint: pgConstraintName ?? null }
          : undefined
    },
    { status: finalStatus }
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
