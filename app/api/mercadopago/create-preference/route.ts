import { NextResponse } from "next/server";
import { createPreference as mpCreatePreference, isTesting } from "@/lib/mercadopago";
import { createClient } from "@/lib/supabase/server";
import { MOCK_RIFAS } from "@/components/rifas/MOCK_RIFAS";
import type { MercadoPagoItem } from "@/lib/mercadopago";
import type { Rifa } from "@/lib/types";

export const runtime = "nodejs";

const MAX_NUMBERS = 20;

function hasMercadoPagoCredentials(): boolean {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  return token.length > 0 && !token.includes("PLACEHOLDER");
}

type PreferencePayload = {
  reserva_id?: string;
  rifa_id: string;
  numbers: string[];
  payer_email?: string;
  payer_name?: string;
  payer_phone?: string;
  external_reference?: string;
};

export async function POST(req: Request) {
  let payload: PreferencePayload;
  try {
    payload = (await req.json()) as PreferencePayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body JSON invalido." },
      { status: 400 }
    );
  }

  const rifaId = (payload.rifa_id ?? "").trim();
  const numbers = Array.isArray(payload.numbers)
    ? (payload.numbers as string[]).map((n) => String(n).trim()).filter(Boolean)
    : [];
  const payerEmail =
    (payload.payer_email ?? "comprador@demo.rifascenter.com").trim();
  const payerName = (payload.payer_name ?? "Comprador Demo").trim();
  const payerPhone = payload.payer_phone ? payload.payer_phone.trim() : undefined;
  const reservaId = payload.reserva_id ? payload.reserva_id.trim() : undefined;
  const externalReference =
    (payload.external_reference ?? `rifa-${rifaId || "demo"}-${Date.now()}`).trim();

  if (!rifaId) {
    return NextResponse.json(
      { ok: false, error: "rifa_id es requerido." },
      { status: 400 }
    );
  }
  if (numbers.length < 1 || numbers.length > MAX_NUMBERS) {
    return NextResponse.json(
      {
        ok: false,
        error: `Numeros invalidos: debes seleccionar entre 1 y ${MAX_NUMBERS}.`
      },
      { status: 400 }
    );
  }
  if (numbers.some((n) => !/^\d{2}$/.test(n))) {
    return NextResponse.json(
      { ok: false, error: "Todos los numeros deben ser formato 00-99." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
    return NextResponse.json(
      { ok: false, error: "Email del pagador invalido." },
      { status: 400 }
    );
  }

  let rifaInfo: Rifa | null | undefined = MOCK_RIFAS.find((r) => r.rifa.id === rifaId)?.rifa;

  if (!rifaInfo && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("rifas")
        .select(`
          id, creator_id, title, prize_name, number_price, total_numbers, available_numbers,
          status, created_at, draw_date, description, cause_name, is_solidarity, prize_value,
          ends_at, creator:profiles!rifas_creator_id_fkey(id, full_name, avatar_url, country)
        `)
        .eq("id", rifaId)
        .single();
      if (!error && data) {
        const row = data as Record<string, unknown>;
        const creator = row.creator as Array<Record<string, unknown>> | Record<string, unknown> | null;
        const creatorObj = Array.isArray(creator) ? creator[0] ?? null : creator ?? null;
        rifaInfo = {
          id: String(row.id),
          creator_id: String(row.creator_id),
          title: String(row.title),
          prize_name: String(row.prize_name),
          prize_value: Number(row.prize_value ?? 0),
          number_price: Number(row.number_price),
          total_numbers: Number(row.total_numbers),
          available_numbers: Number(row.available_numbers),
          status: (String(row.status ?? "active") as Rifa["status"]),
          created_at: String(row.created_at ?? new Date().toISOString()),
          draw_date: row.draw_date ? String(row.draw_date) : null,
          ends_at: row.ends_at ? String(row.ends_at) : null,
          description: String(row.description ?? row.title),
          is_solidarity: row.is_solidarity === true,
          cause_name: row.cause_name ? String(row.cause_name) : null,
          creator: creatorObj
            ? {
                id: String(creatorObj.id ?? ""),
                full_name: creatorObj.full_name !== null && creatorObj.full_name !== undefined
                  ? String(creatorObj.full_name)
                  : null,
                avatar_url: creatorObj.avatar_url !== null && creatorObj.avatar_url !== undefined
                  ? String(creatorObj.avatar_url)
                  : null,
                country: creatorObj.country !== null && creatorObj.country !== undefined
                  ? String(creatorObj.country)
                  : null
              }
            : null
        } as Rifa;
      }
    } catch (err) {
      console.warn("[create-preference] fallback supabase rifa load failed", err);
    }
  }

  if (!rifaInfo) {
    return NextResponse.json(
      { ok: false, error: "Rifa no encontrada." },
      { status: 404 }
    );
  }

  const unitPrice = rifaInfo.number_price;
  const subtotal = unitPrice * numbers.length;
  const platformFee = Math.round(subtotal * 0.03);
  const totalAmount = subtotal + platformFee;

  const currencyMap: Record<string, string> = {
    Argentina: "ARS",
    México: "MXN",
    Chile: "CLP",
    Colombia: "COP",
    Perú: "PEN",
    Venezuela: "VES"
  };
  const country = rifaInfo.creator?.country ?? "Colombia";
  const currency = currencyMap[country] ?? "COP";

  const items: MercadoPagoItem[] = [
    {
      id: `rifa-${rifaId}-numeros`,
      title: `Rifa · ${rifaInfo.prize_name} — ${numbers.length} número${numbers.length === 1 ? "" : "s"} (${numbers.join(", ")})`,
      description: rifaInfo.is_solidarity
        ? `Rifa solidaria · Aporte causa: ${rifaInfo.cause_name ?? rifaInfo.title}`
        : rifaInfo.description ?? rifaInfo.title,
      quantity: 1,
      unit_price: totalAmount,
      currency_id: currency
    }
  ];

  const expirationDateTo = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // =====================================================================
  // FALLBACK MOCK: sin credenciales MP devolvemos preference demo.
  // =====================================================================
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const numbersCsv = numbers.join(",");
  const backQs = new URLSearchParams({
    rifa_id: rifaId,
    numbers: numbersCsv,
    reserva_id: reservaId ?? ""
  });
  const successUrl = `${baseUrl}/checkout/success?${backQs.toString()}`;
  const pendingUrl = `${baseUrl}/checkout/pending?${backQs.toString()}`;
  const failureUrl = `${baseUrl}/checkout/failure?${backQs.toString()}`;

  if (!hasMercadoPagoCredentials()) {
    const mockPrefId = `TEST-MOCK-${Buffer.from(
      `${rifaId}-${numbers.join("")}-${Date.now()}`
    ).toString("base64").slice(0, 24)}`;
    const successQs = new URLSearchParams({
      preference_id: mockPrefId,
      external_reference: externalReference,
      reserva_id: reservaId ?? "",
      payment_id: `MOCK-${Date.now()}`,
      rifa_id: rifaId,
      numbers: numbersCsv
    });
    return NextResponse.json(
      {
        ok: true,
        mock_mode: true,
        message:
          "Mercado Pago credenciales no configuradas. Esta es una preference MOCK para pruebas.",
        testing: true,
        init_point: `${baseUrl}/checkout/success?${successQs.toString()}`,
        sandbox_init_point: `${baseUrl}/checkout/success?${successQs.toString()}`,
        preference_id: mockPrefId,
        external_reference: externalReference,
        reserva_id: reservaId,
        rifa_id: rifaId,
        numbers,
        total_amount: totalAmount,
        subtotal,
        platform_fee: platformFee,
        unit_price: unitPrice,
        currency,
        expires_at: expirationDateTo,
        payer: { email: payerEmail, name: payerName, phone: payerPhone },
        back_urls: { success: successUrl, pending: pendingUrl, failure: failureUrl },
        items
      },
      { status: 201 }
    );
  }

  // =====================================================================
  // MERCADO PAGO REAL: llamamos SDK create preference.
  // =====================================================================
  try {
    const [firstName, ...surnameParts] = payerName.split(" ");
    const surname = surnameParts.join(" ") || " — ";
    const areaCode =
      payerPhone && payerPhone.length >= 7 ? payerPhone.slice(0, 3) : undefined;
    const phoneNumber =
      payerPhone && payerPhone.length >= 7 ? payerPhone.slice(3) : payerPhone;

    const pref = await mpCreatePreference({
      items,
      externalReference,
      metadata: {
        rifa_id: rifaId,
        reserva_id: reservaId ?? "",
        numbers: numbers.join(","),
        environment: isTesting() ? "TEST" : "LIVE",
        platform: "RifasCenter"
      },
      payer: {
        email: payerEmail,
        name: firstName || "Comprador",
        surname: surname,
        phone: areaCode
          ? { area_code: areaCode, number: phoneNumber }
          : phoneNumber
          ? { area_code: "01", number: phoneNumber }
          : undefined
      },
      backUrls: {
        success: successUrl,
        pending: pendingUrl,
        failure: failureUrl
      },
      expires: true,
      expirationDateFrom: new Date(Date.now()).toISOString(),
      expirationDateTo
    });

    return NextResponse.json(
      {
        ok: true,
        mock_mode: false,
        testing: isTesting(),
        init_point: (pref as unknown as { init_point?: string }).init_point ?? "",
        sandbox_init_point:
          (pref as unknown as { sandbox_init_point?: string }).sandbox_init_point ??
          "",
        preference_id: (pref as unknown as { id?: string }).id ?? "",
        external_reference: externalReference,
        reserva_id: reservaId,
        rifa_id: rifaId,
        numbers,
        total_amount: totalAmount,
        subtotal,
        platform_fee: platformFee,
        unit_price: unitPrice,
        currency,
        expires_at: expirationDateTo,
        back_urls: { success: successUrl, pending: pendingUrl, failure: failureUrl }
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[mercadopago] create-preference error", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Error desconocido al crear la preferencia de pago."
      },
      { status: 500 }
    );
  }
}
