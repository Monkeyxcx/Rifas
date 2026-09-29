import type { CreatorFeeChargeStatus } from "@/lib/types";

export const CREATOR_FEE_PERCENT = 0.03;
export const CREATOR_FEE_THRESHOLD = 50;

type ServiceLike = {
  from: (table: string) => any;
};

export type CreatorFeeState = {
  rifa_id: string;
  creator_id: string;
  title: string;
  total_numbers: number;
  number_price: number;
  paid_tickets_count: number;
  trigger_ticket_count: number;
  tickets_remaining_to_trigger: number;
  fee_percentage: number;
  fee_base_amount: number;
  fee_amount: number;
  threshold_reached: boolean;
  blocking_sales: boolean;
  charge_status: CreatorFeeChargeStatus | "not_due";
  mercado_pago_payment_id: string | null;
  mercado_pago_preference_id: string | null;
  external_reference: string | null;
  threshold_reached_at: string | null;
  paid_at: string | null;
};

function toMoneyInt(value: number): number {
  return Math.round(Number(value || 0));
}

export function calculateCreatorFeeBaseAmount(
  totalNumbers: number,
  numberPrice: number
): number {
  return toMoneyInt(Number(totalNumbers || 0) * Number(numberPrice || 0));
}

export function calculateCreatorFeeAmount(
  totalNumbers: number,
  numberPrice: number
): number {
  return toMoneyInt(
    calculateCreatorFeeBaseAmount(totalNumbers, numberPrice) * CREATOR_FEE_PERCENT
  );
}

export async function syncCreatorFeeStateForRifa(
  sb: ServiceLike,
  rifaId: string
): Promise<CreatorFeeState | null> {
  const { data: rifaRaw, error: rifaErr } = await (sb.from("rifas") as any)
    .select("id, creator_id, title, total_numbers, number_price")
    .eq("id", rifaId)
    .maybeSingle();

  if (rifaErr || !rifaRaw) return null;

  const rifa = rifaRaw as {
    id: string;
    creator_id: string;
    title: string;
    total_numbers: number;
    number_price: number;
  };

  const { count: paidCountRaw, error: countErr } = await (sb.from("reservas") as any)
    .select("id", { count: "exact", head: true })
    .eq("rifa_id", rifaId)
    .eq("status", "paid");

  const paidTicketsCount = countErr ? 0 : Number(paidCountRaw ?? 0);
  const feeBaseAmount = calculateCreatorFeeBaseAmount(
    rifa.total_numbers,
    rifa.number_price
  );
  const feeAmount = calculateCreatorFeeAmount(rifa.total_numbers, rifa.number_price);
  const thresholdReached = paidTicketsCount >= CREATOR_FEE_THRESHOLD;

  const { data: existingRaw } = await (sb.from("creator_fee_charges") as any)
    .select("*")
    .eq("rifa_id", rifaId)
    .maybeSingle();

  const existing = existingRaw as
    | {
        status: CreatorFeeChargeStatus;
        mercado_pago_payment_id: string | null;
        mercado_pago_preference_id: string | null;
        external_reference: string | null;
        threshold_reached_at: string | null;
        paid_at: string | null;
      }
    | null;

  if (thresholdReached) {
    const payload = {
      rifa_id: rifa.id,
      creator_id: rifa.creator_id,
      trigger_ticket_count: CREATOR_FEE_THRESHOLD,
      fee_percentage: CREATOR_FEE_PERCENT,
      fee_base_amount: feeBaseAmount,
      fee_amount: feeAmount,
      paid_tickets_count: paidTicketsCount,
      status: existing?.status ?? "pending",
      threshold_reached_at:
        existing?.threshold_reached_at ?? new Date().toISOString()
    };

    await (sb.from("creator_fee_charges") as any).upsert(payload, {
      onConflict: "rifa_id"
    });
  } else if (existing) {
    await (sb.from("creator_fee_charges") as any)
      .update({
        paid_tickets_count: paidTicketsCount,
        fee_base_amount: feeBaseAmount,
        fee_amount: feeAmount
      })
      .eq("rifa_id", rifaId);
  }

  const { data: refreshedRaw } = await (sb.from("creator_fee_charges") as any)
    .select("*")
    .eq("rifa_id", rifaId)
    .maybeSingle();

  const charge = refreshedRaw as
    | {
        status: CreatorFeeChargeStatus;
        mercado_pago_payment_id: string | null;
        mercado_pago_preference_id: string | null;
        external_reference: string | null;
        threshold_reached_at: string | null;
        paid_at: string | null;
      }
    | null;

  const chargeStatus = thresholdReached
    ? ((charge?.status ?? "pending") as CreatorFeeChargeStatus)
    : "not_due";

  return {
    rifa_id: rifa.id,
    creator_id: rifa.creator_id,
    title: rifa.title,
    total_numbers: Number(rifa.total_numbers || 0),
    number_price: Number(rifa.number_price || 0),
    paid_tickets_count: paidTicketsCount,
    trigger_ticket_count: CREATOR_FEE_THRESHOLD,
    tickets_remaining_to_trigger: Math.max(
      0,
      CREATOR_FEE_THRESHOLD - paidTicketsCount
    ),
    fee_percentage: CREATOR_FEE_PERCENT,
    fee_base_amount: feeBaseAmount,
    fee_amount: feeAmount,
    threshold_reached: thresholdReached,
    blocking_sales: thresholdReached && chargeStatus !== "approved",
    charge_status: chargeStatus,
    mercado_pago_payment_id: charge?.mercado_pago_payment_id ?? null,
    mercado_pago_preference_id: charge?.mercado_pago_preference_id ?? null,
    external_reference: charge?.external_reference ?? null,
    threshold_reached_at: charge?.threshold_reached_at ?? null,
    paid_at: charge?.paid_at ?? null
  };
}
