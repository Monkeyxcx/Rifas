import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type UpdateRifaBody = Partial<{
  title: string;
  description: string;
  prize_name: string;
  prize_image_url: string;
  prize_value: number;
  is_solidarity: boolean;
  cause_name: string;
  cause_description: string;
  cause_target: number;
  number_price: number;
  ends_at: string;
  draw_date: string;
  draw_instructions: string;
  country: string;
}>;

type RifaRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  prize_name: string;
  prize_image_url: string | null;
  prize_value: number | null;
  is_solidarity: boolean | null;
  cause_name: string | null;
  cause_description: string | null;
  cause_target: number | null;
  number_price: number;
  total_numbers: number;
  available_numbers: number;
  status: string;
  ends_at: string | null;
  draw_date: string | null;
  draw_instructions: string | null;
  metadata: unknown;
};

function toISO(value: string | undefined | null, hour: "20:00:00" | "19:00:00"): string | null {
  if (!value) return null;
  if (value.includes("T")) return value;
  return `${value}T${hour}.000Z`;
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });

  const { data, error } = await supabase.from("rifas").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: `DB error: ${error.message}` }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "Rifa no encontrada." }, { status: 404 });
  const rifa = data as unknown as RifaRow;
  if (rifa.creator_id !== user.id) return NextResponse.json({ ok: false, error: "No tienes permiso para editar esta rifa." }, { status: 403 });

  const meta = typeof rifa.metadata === "object" && rifa.metadata ? (rifa.metadata as Record<string, unknown>) : {};
  const metaCountry = "country" in meta && typeof meta.country === "string" ? meta.country : undefined;
  return NextResponse.json({
    ok: true,
    rifa: {
      id: rifa.id,
      title: rifa.title,
      description: rifa.description ?? "",
      prize_name: rifa.prize_name,
      prize_image_url: rifa.prize_image_url ?? "",
      prize_value: Number(rifa.prize_value ?? 500_000),
      is_solidarity: Boolean(rifa.is_solidarity),
      cause_name: rifa.cause_name ?? "",
      cause_description: rifa.cause_description ?? "",
      cause_target: Number(rifa.cause_target ?? 0),
      number_price: Number(rifa.number_price),
      total_numbers: Number(rifa.total_numbers),
      ends_at_date: toDateInput(rifa.ends_at),
      draw_date_date: toDateInput(rifa.draw_date),
      draw_instructions: rifa.draw_instructions ?? "",
      country: metaCountry ?? "Colombia"
    }
  });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  let body: UpdateRifaBody = {};
  try {
    body = (await req.json()) as UpdateRifaBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });

  const { data: before, error: fetchErr } = await supabase
    .from("rifas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ ok: false, error: `DB error: ${fetchErr.message}` }, { status: 500 });
  if (!before) return NextResponse.json({ ok: false, error: "Rifa no encontrada." }, { status: 404 });
  const rifa = before as unknown as RifaRow;
  if (rifa.creator_id !== user.id) return NextResponse.json({ ok: false, error: "No tienes permiso para editar esta rifa." }, { status: 403 });

  if (body.title !== undefined) {
    if (body.title.trim().length < 6) return NextResponse.json({ ok: false, error: "Título mínimo 6 caracteres." }, { status: 400 });
    if (body.title.length > 90) return NextResponse.json({ ok: false, error: "Título máximo 90 caracteres." }, { status: 400 });
  }
  if (body.prize_name !== undefined && body.prize_name.trim().length < 3) return NextResponse.json({ ok: false, error: "Nombre premio mínimo 3 caracteres." }, { status: 400 });
  if (body.prize_value !== undefined && Number(body.prize_value) < 50_000) return NextResponse.json({ ok: false, error: "Valor premio mínimo $ 50.000." }, { status: 400 });
  if (body.number_price !== undefined && Number(body.number_price) < 1_000) return NextResponse.json({ ok: false, error: "Precio número mínimo $ 1.000." }, { status: 400 });
  if (body.is_solidarity && (!body.cause_name || body.cause_name.trim().length < 3)) return NextResponse.json({ ok: false, error: "Nombre causa solidaria requerido (mínimo 3 caracteres)." }, { status: 400 });

  const oldMeta = rifa.metadata && typeof rifa.metadata === "object" ? (rifa.metadata as Record<string, unknown>) : {};

  const row: Record<string, unknown> = {};
  if (body.title !== undefined) row.title = body.title.trim();
  if (body.description !== undefined) row.description = body.description?.trim() || null;
  if (body.prize_name !== undefined) row.prize_name = body.prize_name.trim();
  if (body.prize_image_url !== undefined) row.prize_image_url = body.prize_image_url?.trim() || null;
  if (body.prize_value !== undefined) row.prize_value = Number(body.prize_value);
  if (body.is_solidarity !== undefined) {
    row.is_solidarity = Boolean(body.is_solidarity);
    row.cause_name = body.is_solidarity ? body.cause_name?.trim() || null : null;
    row.cause_description = body.is_solidarity ? body.cause_description?.trim() || null : null;
    row.cause_target = body.is_solidarity ? Number(body.cause_target ?? 0) : 0;
  } else if (rifa.is_solidarity) {
    if (body.cause_name !== undefined) row.cause_name = body.cause_name?.trim() || null;
    if (body.cause_description !== undefined) row.cause_description = body.cause_description?.trim() || null;
    if (body.cause_target !== undefined) row.cause_target = Number(body.cause_target ?? 0);
  }
  if (body.number_price !== undefined) row.number_price = Number(body.number_price);
  if (body.ends_at !== undefined) row.ends_at = toISO(body.ends_at, "20:00:00");
  if (body.draw_date !== undefined) row.draw_date = toISO(body.draw_date, "19:00:00");
  if (body.draw_instructions !== undefined) row.draw_instructions = body.draw_instructions?.trim() || null;
  if (body.country !== undefined) {
    row.metadata = { ...oldMeta, country: body.country?.trim() || "Colombia" };
  }
  row.updated_at = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("rifas") as any)
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.error("[api/rifas/:id PATCH] update error", error);
    return NextResponse.json({ ok: false, error: `Error al actualizar rifa: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rifa: data }, { status: 200 });
}
