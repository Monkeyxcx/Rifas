import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Rifa } from "@/lib/types";
import { MOCK_RIFAS } from "@/components/rifas/MOCK_RIFAS";

export const runtime = "nodejs";

const MAX_NUMBERS = 20;
const MIN_NUMBERS = 1;
const RESERVATION_GRACE_MINUTES = 15;

function isMockMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder")
  );
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

export async function POST(req: Request) {
  let payload: { rifa_id: string; numbers: string[]; session_key?: string } | null = null;
  try {
    payload = (await req.json()) as { rifa_id: string; numbers: string[]; session_key?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON invalido en el body." },
      { status: 400 }
    );
  }

  const rifaId = payload?.rifa_id?.trim();
  const numbers = Array.isArray(payload?.numbers)
    ? (payload!.numbers as string[]).map((n) => String(n).trim()).filter(Boolean)
    : [];

  if (!rifaId || !/^[0-9a-fA-F-]{8,}$/.test(rifaId)) {
    return NextResponse.json(
      { ok: false, error: "rifa_id UUID invalido." },
      { status: 400 }
    );
  }

  if (numbers.length < MIN_NUMBERS) {
    return NextResponse.json(
      { ok: false, error: `Debes seleccionar al menos ${MIN_NUMBERS} numero.` },
      { status: 400 }
    );
  }
  if (numbers.length > MAX_NUMBERS) {
    return NextResponse.json(
      { ok: false, error: `Maximo ${MAX_NUMBERS} numeros por reserva.` },
      { status: 400 }
    );
  }
  const invalid = numbers.filter((n) => !/^\d{2}$/.test(n));
  if (invalid.length) {
    return NextResponse.json(
      { ok: false, error: `Numeros con formato invalido: ${invalid.join(", ")}` },
      { status: 400 }
    );
  }
  const duplicates = numbers.filter((n, i, arr) => arr.indexOf(n) !== i);
  if (duplicates.length) {
    return NextResponse.json(
      { ok: false, error: `Numeros duplicados: ${[...new Set(duplicates)].join(", ")}` },
      { status: 400 }
    );
  }

  const rifaMock: Rifa | undefined = MOCK_RIFAS.find((r) => r.rifa.id === rifaId)?.rifa;

  let unitPrice = 0;
  let totalNumbers = 100;
  if (rifaMock) {
    unitPrice = rifaMock.number_price;
    totalNumbers = rifaMock.total_numbers;
  }

  if (numbers.some((n) => parseInt(n, 10) >= totalNumbers)) {
    return NextResponse.json(
      { ok: false, error: `Numeros fuera del rango de esta rifa (00-${String(totalNumbers - 1).padStart(2, "0")}).` },
      { status: 400 }
    );
  }

  // ======================================================================
  // AUTH: Intentamos obtener usuario. Fallback mock crea user anonimo demo.
  // ======================================================================
  let userId: string | null = null;
  let userEmail: string | null = null;
  let displayName: string | null = null;
  if (!isMockMode()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
        displayName =
          (user.user_metadata?.display_name as string | undefined) ??
          (user.user_metadata?.full_name as string | undefined) ??
          null;
      }
    } catch (err) {
      console.warn("[reservar] supabase auth fallo, fallback mock mode", err);
    }
  }

  const mockUser = !userId;
  if (mockUser) {
    userId = `demo-user-${generateUUID().slice(0, 8)}`;
    userEmail = "comprador@demo.rifascenter.com";
    displayName = "Comprador Demo";
  }

  if (!rifaMock && mockUser) {
    return NextResponse.json(
      { ok: false, error: "Rifa no encontrada." },
      { status: 404 }
    );
  }

  const subtotal = numbers.length * unitPrice;
  const platformFee = Math.round(subtotal * 0.03);
  const totalAmount = subtotal + platformFee;
  const expiresAt = new Date(Date.now() + RESERVATION_GRACE_MINUTES * 60 * 1000);
  const reservaId = generateUUID();

  // ======================================================================
  // FALLBACK MOCK: si no hay Supabase real, devolvemos reserva demo.
  // ======================================================================
  if (isMockMode() || mockUser) {
    return NextResponse.json(
      {
        ok: true,
        mock_mode: true,
        reserva_id: reservaId,
        rifa_id: rifaId,
        user_id: userId,
        numbers,
        unit_price: unitPrice,
        subtotal,
        platform_fee: platformFee,
        total_amount: totalAmount,
        currency: rifaMock && rifaMock.creator?.country === "Argentina"
          ? "ARS"
          : rifaMock && rifaMock.creator?.country === "México"
          ? "MXN"
          : rifaMock && rifaMock.creator?.country === "Chile"
          ? "CLP"
          : rifaMock && rifaMock.creator?.country === "Venezuela"
          ? "VES"
          : rifaMock && rifaMock.creator?.country === "Perú"
          ? "PEN"
          : "COP",
        expires_at: expiresAt.toISOString(),
        grace_minutes: RESERVATION_GRACE_MINUTES,
        status: "reserved",
        user: {
          email: userEmail,
          display_name: displayName
        },
        rifa: rifaMock
          ? {
              id: rifaMock.id,
              title: rifaMock.title,
              prize_name: rifaMock.prize_name,
              prize_value: rifaMock.prize_value,
              is_solidarity: rifaMock.is_solidarity,
              cause_name: rifaMock.cause_name,
              creator_name: rifaMock.creator?.full_name ?? "Anonimo",
              country: rifaMock.creator?.country ?? null,
              ends_at: rifaMock.ends_at,
              draw_date: rifaMock.draw_date
            }
          : null
      },
      { status: 201 }
    );
  }

  // ======================================================================
  // PATH SUPABASE REAL: llamamos a RPC buy_reservations FOR UPDATE.
  // ======================================================================
  try {
    const supabase = await createClient();
    const { data, error } = await (
      supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{
        data: Array<{ success: boolean; message: string; failed_number: string | null }> | null;
        error: { message: string } | null;
      }>
    )("buy_reservations", {
      p_rifa_id: rifaId,
      p_user_id: userId as string,
      p_numbers: numbers
    });

    if (error || !data || !(data as Array<Record<string, unknown>>).length) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error?.message ??
            "Error al reservar los numeros. Intenta nuevamente."
        },
        { status: 409 }
      );
    }

    const result = (data as Array<{ success: boolean; message: string; failed_number: string | null }>)[0];
    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: result.message || "Numero ya vendido/reservado.",
          failed_number: result.failed_number
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        mock_mode: false,
        reserva_id: reservaId,
        rifa_id: rifaId,
        user_id: userId,
        numbers,
        unit_price: unitPrice,
        subtotal,
        platform_fee: platformFee,
        total_amount: totalAmount,
        currency: "COP",
        expires_at: expiresAt.toISOString(),
        grace_minutes: RESERVATION_GRACE_MINUTES,
        status: "reserved"
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[reservar] rpc error", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Error desconocido al procesar la reserva."
      },
      { status: 500 }
    );
  }
}
