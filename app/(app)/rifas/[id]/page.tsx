import {
  Award,
  Calendar,
  Gift,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Users
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import RifaDetailActions from "@/components/rifas/RifaDetailActions";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Rifa, RifaStats } from "@/lib/types";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type RifaLookupRow = Rifa & {
  creator: { id: string; full_name: string; avatar_url: string | null; country: string | null } | null;
};

async function getRifaById(id: string): Promise<{
  rifa: RifaLookupRow;
  stats: RifaStats;
  soldNumbers: Set<string>;
  mineNumbers: Set<string>;
  currentUserId: string | null;
} | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const uid = user?.id ?? null;

    const { data: rifaRow, error: rErr } = await supabase
      .from("rifas")
      .select(`*`)
      .eq("id", id)
      .maybeSingle();

    if (rErr || !rifaRow) return null;

    let creator: RifaLookupRow["creator"] = null;
    const rifaAny = rifaRow as Record<string, unknown>;
    if (rifaAny.creator_id && typeof rifaAny.creator_id === "string") {
      try {
        const { data: creatorRow } = await supabase
          .from("profiles")
          .select("id,full_name,avatar_url,country")
          .eq("id", rifaAny.creator_id)
          .maybeSingle();
        if (creatorRow) {
          const cr = creatorRow as Record<string, unknown>;
          creator = {
            id: String(cr.id ?? ""),
            full_name: String(cr.full_name ?? ""),
            avatar_url: cr.avatar_url as string | null,
            country: cr.country as string | null
          };
        }
      } catch {
        /* creator no disponible, rifa se muestra igual */
      }
    }

    const rifa = { ...(rifaRow as unknown as Rifa), creator } as unknown as RifaLookupRow;

    // ================================================================
    // LAZY EXPIRE INLINE — NO esperar cron 24h Vercel Hobby.
    // Cada page load limpia las reservas vencidas status=reserved pero
    // expires_at<NOW. Trigger trg_sync_rifa_available actualiza solo
    // rifas.available_numbers sin drift. service_role bypass RLS.
    // ================================================================
    try {
      const adminSb = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminSb as any).rpc("expire_rifa_reservations", { p_rifa_id: rifa.id });
    } catch {
      /* no-op: RPC puede no estar aplicado aún en cloud, sin romper render */
    }

    const total = Number(rifa.total_numbers) || 100;
    const avail = Number(rifa.available_numbers) ?? total;
    const sold = Math.max(0, total - avail);
    const soldPct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
    const stats: RifaStats = {
      rifa_id: rifa.id,
      total_numbers: total,
      sold_numbers: sold,
      available_numbers: avail,
      sold_percentage: soldPct,
      number_price: Number(rifa.number_price) || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: rifa.status as any,
      created_at: rifa.created_at as string,
      ends_at: (rifa.ends_at as string | null) ?? null,
      draw_date: (rifa.draw_date as string | null) ?? null
    };

    const soldSet = new Set<string>();
    const mineSet = new Set<string>();
    try {
      const adminSb = createServiceClient();
      const { data: rows } = await adminSb
        .from("reservas")
        .select("number,status,user_id")
        .eq("rifa_id", rifa.id)
        .in("status", ["reserved", "paid"]);
      if (rows && rows.length > 0) {
        for (const r of rows as Array<{
          number: string;
          status: string;
          user_id: string;
        }>) {
          soldSet.add(r.number);
          if (uid && r.user_id === uid) mineSet.add(r.number);
        }
      }
    } catch {
      /* no-op */
    }

    return { rifa, stats, soldNumbers: soldSet, mineNumbers: mineSet, currentUserId: uid };
  } catch (e) {
    console.error("[rifa detail] fetch failed", e);
    return null;
  }
}

export default async function RifaDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ numbers?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const result = await getRifaById(id);

  const NUM_RE = /^\d{2}$/;
  const preselectedNumbers: string[] = Array.isArray(sp?.numbers)
    ? []
    : (sp?.numbers ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((n) => NUM_RE.test(n));
  if (!result) {
    notFound();
  }

  const { rifa, stats, soldNumbers, mineNumbers, currentUserId } = result;
  if (rifa.status !== "active") {
    return notFound();
  }

  const soldOut = stats.available_numbers <= 0;
  const raised = stats.sold_numbers * stats.number_price;

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-10 overflow-hidden">
      <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mb-3 sm:mb-5 min-w-0">
        <Link href="/rifas" className="hover:text-brand-rose transition shrink-0">
          Rifas activas
        </Link>
        <span className="text-slate-300 shrink-0">/</span>
        <span className="text-slate-800 font-medium truncate min-w-0 flex-1">
          {rifa.title}
        </span>
      </nav>

      <div className="space-y-4 sm:space-y-6 w-full">
        <div>
          <div
            className={cn(
              "relative aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden shadow-[0_16px_50px_-18px_rgba(15,23,42,0.18)]",
              rifa.is_solidarity
                ? "bg-gradient-to-br from-brand-cyan via-cyan-500 to-brand-rose"
                : "bg-gradient-to-br from-brand-rose via-pink-500 to-brand-violet"
            )}
          >
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Badge
                variant={rifa.is_solidarity ? "solidarity" : "prize"}
                className="shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)] !text-[10px] sm:!text-xs"
              >
                {rifa.is_solidarity ? (
                  <>
                    <Heart className="h-2.5 w-2.5 mr-1" /> Solidaria
                  </>
                ) : (
                  <>
                    <Gift className="h-2.5 w-2.5 mr-1" /> Premio
                  </>
                )}
              </Badge>
              {stats.sold_percentage >= 80 && (
                <Badge variant="destructive" className="!bg-rose-500 shadow-[0_8px_24px_-8px_rgba(255,27,81,0.45)] !text-[10px] sm:!text-xs">
                  ¡Se agota!
                </Badge>
              )}
              {soldOut && (
                <Badge variant="closed" className="!text-[10px] sm:!text-xs">
                  <Award className="h-2.5 w-2.5 mr-1" /> Agotada
                </Badge>
              )}
            </div>
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="!bg-white/15 !border-white/30 !text-white hover:!bg-white/25 backdrop-blur h-7 sm:h-8 rounded-full !text-[11px] sm:!text-xs px-2 sm:px-3"
              >
                <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> Compartir
              </Button>
              {currentUserId && (
                <Badge variant="outline" className="!bg-white/20 !text-white !border-white/30 backdrop-blur !text-[10px] sm:!text-xs py-0">
                  {mineNumbers.size > 0 ? `🎟 ${mineNumbers.size}` : "Sesión ok"}
                </Badge>
              )}
            </div>

            <div className="absolute inset-0 grid place-items-center">
              <div className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 rounded-[1.5rem] sm:rounded-[2rem] bg-white/20 backdrop-blur grid place-items-center text-5xl sm:text-6xl md:text-7xl shadow-2xl">
                {rifa.is_solidarity ? "💝" : "🏆"}
              </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 flex items-end justify-between gap-3">
              <div className="text-white drop-shadow-sm">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-bold opacity-80">
                  Premio
                </div>
                <div className="mt-0.5 sm:mt-1 font-display font-black text-xl sm:text-2xl md:text-4xl leading-tight tabular-nums">
                  {formatCurrency(rifa.prize_value)}
                </div>
              </div>
              {rifa.creator?.country && (
                <Badge
                  variant="outline"
                  className="!bg-white/15 !border-white/30 !text-white backdrop-blur !text-[10px] sm:!text-xs py-0 shrink-0"
                >
                  <MapPin className="h-2.5 w-2.5 mr-1" /> {rifa.creator.country}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="font-display font-black text-xl sm:text-2xl md:text-3xl leading-[1.08] text-slate-900">
                  {rifa.title}
                </h1>
                {rifa.is_solidarity && rifa.cause_name && (
                  <div className="mt-2 inline-flex items-center gap-2 text-xs sm:text-sm text-brand-cyan-800 bg-brand-cyan/10 border border-brand-cyan/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl">
                    <Heart className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0" />
                    <span className="font-bold truncate">{rifa.cause_name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <Card className="border-slate-200 bg-white/60">
                <CardContent className="p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-2.5">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-lg sm:rounded-xl bg-brand-rose/10 grid place-items-center text-brand-rose">
                    <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Vendidos
                    </div>
                    <div className="font-display font-black text-base sm:text-lg text-slate-900 tabular-nums">
                      {stats.sold_numbers}/{stats.total_numbers}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white/60">
                <CardContent className="p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-2.5">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-lg sm:rounded-xl bg-brand-violet/10 grid place-items-center text-brand-violet">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Recaudado
                    </div>
                    <div className="font-display font-black text-base sm:text-lg text-slate-900 tabular-nums">
                      {formatCurrency(raised)}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white/60">
                <CardContent className="p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-2.5">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-lg sm:rounded-xl bg-brand-rose/10 grid place-items-center text-brand-rose">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Cierra
                    </div>
                    <div className="font-display font-black text-base sm:text-lg text-slate-900 tabular-nums truncate">
                      {rifa.ends_at ? formatRelativeTime(rifa.ends_at) : "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white/60">
                <CardContent className="p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-2.5">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-lg sm:rounded-xl bg-brand-gold/10 grid place-items-center text-brand-gold">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Creador
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {rifa.creator?.full_name ?? "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="numeros" className="w-full">
            <TabsList
              className="!bg-slate-100/70 !h-auto sm:!h-11 rounded-2xl sm:rounded-full p-1 flex overflow-x-auto gap-1 sm:gap-0 sm:grid sm:grid-cols-4 hide-scroll"
              style={{ scrollbarWidth: "none" }}
            >
              <style>{`.hide-scroll::-webkit-scrollbar{display:none}`}</style>
              <TabsTrigger
                value="descripcion"
                className="shrink-0 rounded-full data-[state=active]:!bg-white data-[state=active]:!text-slate-900 data-[state=active]:shadow-sm text-xs sm:text-sm"
              >
                Descripción
              </TabsTrigger>
              <TabsTrigger
                value="numeros"
                className="shrink-0 rounded-full data-[state=active]:!bg-gradient-to-r data-[state=active]:from-brand-rose data-[state=active]:to-brand-violet data-[state=active]:!text-white data-[state=active]:shadow-cta text-xs sm:text-sm"
              >
                Números
              </TabsTrigger>
              <TabsTrigger
                value="sorteo"
                className="shrink-0 rounded-full data-[state=active]:!bg-white data-[state=active]:!text-slate-900 data-[state=active]:shadow-sm text-xs sm:text-sm"
              >
                Sorteo
              </TabsTrigger>
              <TabsTrigger
                value="creador"
                className="shrink-0 rounded-full data-[state=active]:!bg-white data-[state=active]:!text-slate-900 data-[state=active]:shadow-sm text-xs sm:text-sm"
              >
                Creador
              </TabsTrigger>
            </TabsList>

            <TabsContent value="descripcion" className="mt-3 sm:mt-5 space-y-4 sm:space-y-5 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-slate-200 bg-white/70">
                <CardContent className="p-4 sm:p-5 space-y-2 sm:space-y-3">
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                    Descripción
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {rifa.description ?? rifa.prize_name}
                  </p>
                </CardContent>
              </Card>

              {rifa.is_solidarity && (rifa.cause_description || rifa.cause_target > 0) && (
                <Card className="border-brand-cyan/20 bg-gradient-to-br from-brand-cyan/5 via-white to-brand-rose/5">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="solidarity" className="!text-[10px] sm:!text-xs">
                        <Heart className="h-2.5 w-2.5 mr-1" /> Causa
                      </Badge>
                      {rifa.cause_target > 0 && (
                        <Badge variant="outline" className="!border-cyan-200 !text-brand-cyan-700 !bg-cyan-50 !text-[10px] sm:!text-xs py-0">
                          Meta {formatCurrency(rifa.cause_target)}
                        </Badge>
                      )}
                    </div>
                    {rifa.cause_description && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {rifa.cause_description}
                      </p>
                    )}
                    {rifa.cause_target > 0 && (
                      <div className="space-y-1.5 pt-1 sm:pt-2">
                        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium">
                          <span>Progreso causa</span>
                          <span className="font-numbers tabular-nums font-bold text-brand-cyan-700">
                            {rifa.cause_target > 0
                              ? Math.min(100, Math.round((raised / rifa.cause_target) * 100))
                              : 0}%
                          </span>
                        </div>
                        <Progress
                          value={
                            rifa.cause_target > 0
                              ? Math.min(100, (raised / rifa.cause_target) * 100)
                              : 0
                          }
                          className="h-2 sm:h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-cyan [&>div]:to-brand-rose [&>div]:rounded-full"
                        />
                        <div className="text-[10px] sm:text-[11px] text-slate-400">
                          {formatCurrency(raised)} de {formatCurrency(rifa.cause_target || 0)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="numeros" className="mt-3 sm:mt-5 focus-visible:outline-none focus-visible:ring-0">
              <RifaDetailActions
                rifaId={rifa.id}
                isSolidarity={rifa.is_solidarity}
                titleHeader="Participa ahora"
                numberPrice={rifa.number_price}
                totalNumbers={stats.total_numbers}
                soldNumbers={soldNumbers}
                mineNumbers={mineNumbers}
                availableCount={stats.available_numbers}
                soldPercentage={stats.sold_percentage}
                soldOut={soldOut}
                initialNumbers={preselectedNumbers}
              />
            </TabsContent>

            <TabsContent value="sorteo" className="mt-3 sm:mt-5 focus-visible:outline-none focus-visible:ring-0 space-y-3 sm:space-y-4">
              <Card className="border-slate-200 bg-white/70">
                <CardContent className="p-4 sm:p-5 grid md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-brand-gold/10 via-white to-brand-rose/5 border border-brand-gold/20 p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-brand-gold-700 font-bold">
                      Fecha sorteo
                    </div>
                    <div className="font-display font-black text-lg sm:text-2xl text-slate-900">
                      {rifa.draw_date
                        ? new Date(rifa.draw_date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })
                        : "—"}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500">
                      {rifa.draw_date
                        ? `Hora ${new Date(rifa.draw_date).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}`
                        : ""}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-brand-rose/5 via-white to-brand-violet/5 border border-slate-200 p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-brand-violet font-bold">
                      Cierre ventas
                    </div>
                    <div className="font-display font-black text-lg sm:text-2xl text-slate-900">
                      {rifa.ends_at
                        ? new Date(rifa.ends_at).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })
                        : "—"}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500">
                      {rifa.ends_at ? `Faltan ${formatRelativeTime(rifa.ends_at)}` : ""}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="creador" className="mt-3 sm:mt-5 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-slate-200 bg-white/70">
                <CardContent className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-rose via-pink-500 to-brand-violet grid place-items-center text-white font-display font-black text-xl sm:text-2xl shadow-[0_10px_30px_-12px_rgba(255,27,81,0.35)]">
                      {(rifa.creator?.full_name ?? "??")
                        .split(" ")
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() ?? "")
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-black text-lg sm:text-xl text-slate-900 truncate">
                        {rifa.creator?.full_name ?? "Creador"}
                      </div>
                      {rifa.creator?.country && (
                        <div className="mt-0.5 text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {rifa.creator.country}
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="h-8 sm:h-9 !text-[11px] sm:!text-xs px-2 sm:px-3">
                      Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
