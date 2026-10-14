import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-fA-F-]{36}$/;
const NUM_RE = /^\d{2}$/;

type Body = {
  rifa_id?: string;
  reserva_ids?: string[];
  numbers?: string[];
  amount?: number;
  payment_method_type?: string;
  voucher_image_url?: string;
  voucher_reference?: string | null;
  payer_phone?: string | null;
};

const ALLOWED_METHODS = new Set([
  "nequi",
  "bancolombia_qr",
  "bancolombia_transfer"
]);

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;

  const rifaId = (body.rifa_id ?? "").trim();
  const reservaIds = Array.isArray(body.reserva_ids) ? body.reserva_ids : [];
  const numbers = Array.isArray(body.numbers) ? body.numbers : [];
  const amount = Number(body.amount ?? NaN);
  const methodType = (body.payment_method_type ?? "").trim();
  const voucherUrl = (body.voucher_image_url ?? "").trim();

  if (!UUID_RE.test(rifaId))
    return NextResponse.json({ ok: false, error: "rifa_id inválido" }, { status: 400 });
  if (!ALLOWED_METHODS.has(methodType))
    return NextResponse.json({ ok: false, error: "método de pago inválido" }, { status: 400 });
  if (!voucherUrl || voucherUrl.length > 2000)
    return NextResponse.json({ ok: false, error: "voucher_image_url requerido" }, { status: 400 });
  if (!numbers.length || numbers.length > 20)
    return NextResponse.json({ ok: false, error: "numbers inválido (1-20)" }, { status: 400 });
  if (numbers.some((n) => !NUM_RE.test(n)))
    return NextResponse.json({ ok: false, error: "formato de números inválido (00-99)" }, { status: 400 });
  if (new Set(numbers).size !== numbers.length)
    return NextResponse.json({ ok: false, error: "números duplicados" }, { status: 400 });
  if (!reservaIds.length || reservaIds.some((id) => !UUID_RE.test(id)))
    return NextResponse.json({ ok: false, error: "reserva_ids inválidos" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ ok: false, error: "amount inválido" }, { status: 400 });

  const authSb = await createClient();
  const {
    data: { user }
  } = await authSb.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "no auth" }, { status: 401 });

  const sb = createServiceClient();
  const svc = sb as unknown as any;

  // Rifa + precio esperado
  const { data: rifaRow, error: rifaErr } = await svc
    .from("rifas")
    .select("id, number_price, status")
    .eq("id", rifaId)
    .maybeSingle();
  if (rifaErr || !rifaRow)
    return NextResponse.json({ ok: false, error: "rifa no encontrada" }, { status: 404 });
  const unitPrice = Number((rifaRow as any).number_price ?? 0);
  const expected = numbers.length * unitPrice;
  // Tolerancia: redondeo COP sin decimales. Exige monto exacto o mayor.
  if (!Number.isFinite(unitPrice) || unitPrice <= 0 || amount < expected) {
    return NextResponse.json(
      { ok: false, error: `monto insuficiente: esperado ${expected}, recibido ${amount}`, expected },
      { status: 409 }
    );
  }

  // Reservas: deben existir, ser del usuario, de esta rifa, reserved y no vencidas
  const { data: reservaRows, error: resErr } = await svc
    .from("reservas")
    .select("id, rifa_id, user_id, number, status, expires_at")
    .in("id", reservaIds);
  if (resErr)
    return NextResponse.json({ ok: false, error: resErr.message }, { status: 500 });
  const rows = (reservaRows ?? []) as Array<{
    id: string;
    rifa_id: string;
    user_id: string;
    number: string;
    status: string;
    expires_at: string;
  }>;
  if (rows.length !== reservaIds.length)
    return NextResponse.json({ ok: false, error: "alguna reserva no existe" }, { status: 409 });

  const now = Date.now();
  for (const r of rows) {
    if (r.user_id !== user.id || r.rifa_id !== rifaId)
      return NextResponse.json({ ok: false, error: "reserva no te pertenece" }, { status: 403 });
    if (r.status !== "reserved")
      return NextResponse.json(
        { ok: false, error: `reserva ${r.number} ya no está disponible (${r.status})` },
        { status: 409 }
      );
    if (new Date(r.expires_at).getTime() <= now)
      return NextResponse.json(
        { ok: false, error: `reserva ${r.number} vencida, vuelve a reservar` },
        { status: 409 }
      );
  }
  const rowNumbers = new Set(rows.map((r) => r.number));
  for (const n of numbers) {
    if (!rowNumbers.has(n))
      return NextResponse.json(
        { ok: false, error: `número ${n} no coincide con tus reservas` },
        { status: 409 }
      );
  }

  // Anti-duplicado: una reserva no puede tener otro voucher pending
  const { data: dup } = await svc
    .from("nequi_payments")
    .select("id")
    .eq("rifa_id", rifaId)
    .eq("status", "pending")
    .overlaps("reserva_ids", reservaIds)
    .limit(1);
  if (dup && (dup as unknown[]).length) {
    return NextResponse.json(
      { ok: false, error: "ya enviaste un comprobante pendiente para estas reservas" },
      { status: 409 }
    );
  }

  const { data: inserted, error: insErr } = await svc
    .from("nequi_payments")
    .insert({
      rifa_id: rifaId,
      user_id: user.id,
      reserva_ids: reservaIds,
      payment_method_type: methodType,
      numbers,
      amount,
      voucher_image_url: voucherUrl.slice(0, 2000),
      voucher_reference: (body.voucher_reference ?? "").trim().slice(0, 80) || null,
      payer_phone: (body.payer_phone ?? "").trim().slice(0, 15) || null,
      status: "pending"
    })
    .select("id")
    .maybeSingle();
  if (insErr)
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

  return NextResponse.json(
    { ok: true, id: (inserted as any)?.id ?? null },
    { status: 201 }
  );
}
