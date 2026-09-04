import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

type RifaInsert = Database["public"]["Tables"]["rifas"]["Insert"];

type CreateRifaBody = Partial<{
  title: string;
  description: string;
  prize_name: string;
  prize_image_url: string;
  prize_value: number;
  is_solidarity: boolean;
  cause_name: string;
  cause_description: string;
  cause_target: number;
  total_numbers: number;
  number_price: number;
  ends_at: string;
  draw_date: string;
  draw_instructions: string;
  country: string;
}>;

function toISO(value: string | undefined | null, hour: "20:00:00" | "19:00:00"): string | null {
  if (!value) return null;
  if (value.includes("T")) return value;
  return `${value}T${hour}.000Z`;
}

function validate(body: CreateRifaBody): string | null {
  if (!body.title || body.title.trim().length < 6) return "Título demasiado corto (mínimo 6 caracteres).";
  if (body.title.length > 90) return "Título demasiado largo (máximo 90 caracteres).";
  if (!body.prize_name || body.prize_name.trim().length < 3) return "Nombre del premio demasiado corto (mínimo 3 caracteres).";
  const prizeValue = Number(body.prize_value ?? 0);
  if (!prizeValue || prizeValue < 50_000) return "Valor premio mínimo $ 50.000 COP.";
  const total = Number(body.total_numbers ?? 0);
  if (total < 10 || total > 100) return "Cantidad números debe estar entre 10 y 100.";
  const price = Number(body.number_price ?? 0);
  if (!price || price < 1_000) return "Precio por número mínimo $ 1.000 COP.";
  if (body.is_solidarity && (!body.cause_name || body.cause_name.trim().length < 3)) return "Activa la causa solidaria: nombre causa mínimo 3 caracteres.";
  if (!body.ends_at) return "Fecha límite de venta es requerida.";
  if (!body.draw_date) return "Fecha sorteo es requerida.";
  if (!body.draw_instructions || body.draw_instructions.trim().length < 10) return "Instrucciones sorteo mínimo 10 caracteres.";
  return null;
}

export async function POST(req: NextRequest) {
  let body: CreateRifaBody = {};
  try {
    body = (await req.json()) as CreateRifaBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const invalid = validate(body);
  if (invalid) return NextResponse.json({ ok: false, error: invalid }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ ok: false, error: "No autenticado. Inicia sesión antes de crear una rifa." }, { status: 401 });

  const total = Number(body.total_numbers!);
  const endsAt = toISO(body.ends_at, "20:00:00");
  const drawDate = toISO(body.draw_date, "19:00:00");
  const country = body.country?.trim() || "Colombia";

  const row: RifaInsert = {
    creator_id: user.id,
    title: body.title!.trim(),
    description: body.description?.trim() || null,
    prize_name: body.prize_name!.trim(),
    prize_image_url: body.prize_image_url?.trim() || null,
    prize_value: Number(body.prize_value),
    is_solidarity: Boolean(body.is_solidarity),
    cause_name: body.is_solidarity ? body.cause_name?.trim() || null : null,
    cause_description: body.is_solidarity ? body.cause_description?.trim() || null : null,
    cause_target: body.is_solidarity ? Number(body.cause_target ?? 0) : 0,
    number_price: Number(body.number_price),
    total_numbers: total,
    available_numbers: total,
    status: "active",
    ends_at: endsAt,
    draw_date: drawDate,
    draw_instructions: body.draw_instructions!.trim(),
    metadata: { country }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("rifas") as any).insert([row]).select("*").single();
  if (error) {
    console.error("[api/rifas POST] insert error", error);
    return NextResponse.json({ ok: false, error: `Error al crear rifa: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rifa_id: (data as { id: string }).id, rifa: data }, { status: 201 });
}
