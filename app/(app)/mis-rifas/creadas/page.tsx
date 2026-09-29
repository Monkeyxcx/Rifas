import CreatorFeePaymentButton from "@/components/creator/CreatorFeePaymentButton";
import CreadasRifasList from "@/components/rifas/CreadasRifasList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { syncCreatorFeeStateForRifa } from "@/lib/creator-fees";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Rifa, RifaStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
    BarChart3,
    CircleDollarSign,
    Plus,
    Settings2,
    UsersRound
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const CREATOR_PROFILES_FRAGMENT = `
  id, full_name, avatar_url, country
`;

const RIFAS_SELECT_FRAGMENT = `
  id, creator_id, title, slug, description, prize_name, prize_image_url,
  prize_value, is_solidarity, cause_name, cause_description, cause_target,
  number_price, total_numbers, available_numbers, status, ends_at, draw_date,
  draw_instructions, banner_ad_config, metadata, created_at, updated_at,
  creator:profiles!rifas_creator_id_fkey(${CREATOR_PROFILES_FRAGMENT})
`;

type CreadasRow = {
  id: string;
  creator_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  prize_name: string;
  prize_image_url: string | null;
  prize_value: number;
  is_solidarity: boolean;
  cause_name: string | null;
  cause_description: string | null;
  cause_target: number;
  number_price: number;
  total_numbers: number;
  available_numbers: number;
  status: RifaStatus;
  ends_at: string | null;
  draw_date: string | null;
  draw_instructions: string | null;
  banner_ad_config: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    country: string | null;
  } | null;
};

async function loadMisCreadas(): Promise<Array<{ rifa: Rifa; status: RifaStatus }>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();
  if (userErr || !user) redirect("/auth");

  const { data, error } = await supabase
    .from("rifas")
    .select(RIFAS_SELECT_FRAGMENT)
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[mis-rifas/creadas] DB error", error);
    return [];
  }
  const rows = (data ?? []) as unknown as CreadasRow[];

  return rows.map((r) => ({
    rifa: {
      id: r.id,
      creator_id: r.creator_id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      prize_name: r.prize_name,
      prize_image_url: r.prize_image_url,
      prize_value: r.prize_value,
      is_solidarity: r.is_solidarity,
      cause_name: r.cause_name,
      cause_description: r.cause_description,
      cause_target: r.cause_target,
      number_price: r.number_price,
      total_numbers: r.total_numbers,
      available_numbers: r.available_numbers,
      status: r.status as RifaStatus,
      ends_at: r.ends_at,
      draw_date: r.draw_date,
      draw_instructions: r.draw_instructions,
      banner_ad_config: r.banner_ad_config,
      metadata: r.metadata,
      created_at: r.created_at,
      updated_at: r.updated_at,
      creator: r.creator
        ? {
            id: r.creator.id,
            full_name: r.creator.full_name ?? null,
            avatar_url: r.creator.avatar_url ?? null,
            country: r.creator.country ?? null
          }
        : null
    },
    status: (r.status ?? "active") as RifaStatus
  }));
}

export default async function MisRifasCreadasPage() {
  const creadas = await loadMisCreadas();
  const adminSb = createServiceClient();
  const totalRecaudado = creadas.reduce(
    (acc, c) =>
      acc +
      (c.rifa.total_numbers - c.rifa.available_numbers) * c.rifa.number_price,
    0
  );
  const totalVendidos = creadas.reduce(
    (acc, c) => acc + (c.rifa.total_numbers - c.rifa.available_numbers),
    0
  );
  const rifasActivas = creadas.filter((c) => c.status === "active").length;
  const totalLimit = creadas.reduce((acc, c) => acc + c.rifa.total_numbers, 0);
  const creatorFeeStates = (
    await Promise.all(
      creadas.map(async (c) => syncCreatorFeeStateForRifa(adminSb, c.rifa.id))
    )
  ).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const pendingFeeStates = creatorFeeStates.filter((s) => s.blocking_sales);
  const pendingFeeTotal = pendingFeeStates.reduce(
    (acc, s) => acc + (s?.fee_amount ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-7xl px-4 py-10 lg:py-12">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                Mis rifas creadas
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 lg:text-base">
                Administra tus sorteos: edita detalles, comparte, revisa estadísticas de ventas
                y sigue el progreso en tiempo real.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-11 shrink-0 bg-brand-rose font-semibold text-white hover:bg-brand-rose/90"
            >
              <Link href="/rifas/crear" className="flex items-center gap-2">
                <Plus className="h-5 w-5" strokeWidth={2.2} />
                Crear nueva rifa
              </Link>
            </Button>
          </div>
        </header>

        {/* 3 STATS CARDS */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                Recaudado total
              </CardTitle>
              <Badge variant="active" className="font-numbers tabular-nums">
                en curso
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="font-numbers text-3xl font-black tabular-nums tracking-tight text-emerald-600">
                {formatCurrency(totalRecaudado)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {creadas.length} rifa{creadas.length === 1 ? "" : "s"} · Sin recargo para el comprador
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-brand-rose" />
                Números vendidos
              </CardTitle>
              <Badge variant="new" className="font-numbers tabular-nums">
                +{totalVendidos} totales
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="font-numbers text-3xl font-black tabular-nums tracking-tight text-brand-rose">
                {totalVendidos.toLocaleString("es-CO")}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {totalLimit > 0
                  ? Math.round((totalVendidos / totalLimit) * 100)
                  : 0}
                % de límite total vendido
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brand-cyan" />
                Rifas activas
              </CardTitle>
              <Badge variant="solidarity" className="font-numbers tabular-nums">
                {creadas.length > 0
                  ? `${Math.round((rifasActivas / creadas.length) * 100)}%`
                  : "0%"} activas
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="font-numbers text-3xl font-black tabular-nums tracking-tight text-brand-cyan">
                {rifasActivas}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {creadas.length - rifasActivas} cerrada
                {creadas.length - rifasActivas === 1 ? "" : "s"} · 0 borrador/es
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-brand-gold/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-slate-900">
              Comisión del creador · clara y sin cobrarle al comprador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              El comprador paga únicamente el valor de sus boletas. La plataforma le
              cobra al creador el <b>3% del valor total de la rifa</b> cuando llega a{" "}
              <b>50 boletas vendidas y pagadas</b>.
            </p>
            <p>
              Si esa comisión queda pendiente, las nuevas ventas de esa rifa se pausan
              temporalmente hasta que el creador la pague por Mercado Pago.
            </p>
            {pendingFeeStates.length > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-bold text-amber-900">
                  Tienes {pendingFeeStates.length} rifa{pendingFeeStates.length === 1 ? "" : "s"} pausada{pendingFeeStates.length === 1 ? "" : "s"} por comisión pendiente
                </div>
                <div className="mt-1 text-xs text-amber-800">
                  Total pendiente: {formatCurrency(pendingFeeTotal)}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {pendingFeeStates.map((state) => (
                    <div
                      key={state.rifa_id}
                      className="rounded-xl border border-amber-200 bg-white p-4"
                    >
                      <div className="text-sm font-bold text-slate-900">{state.title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {state.paid_tickets_count} boletas pagadas · comisión pendiente {formatCurrency(state.fee_amount)}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <CreatorFeePaymentButton
                          rifaId={state.rifa_id}
                          amount={state.fee_amount}
                        />
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                          <Link href={`/rifas/crear?editar=${state.rifa_id}`}>
                            <Settings2 className="mr-2 h-4 w-4" />
                            Ver rifa
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                No tienes rifas pausadas por comisión pendiente en este momento.
              </div>
            )}
          </CardContent>
        </Card>

        {/* TABS + BUSCAR + GRID */}
        <CreadasRifasList items={creadas} />
      </div>
    </main>
  );
}
