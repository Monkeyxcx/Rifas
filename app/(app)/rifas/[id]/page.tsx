import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Share2,
  Gift,
  Heart,
  Award,
  Users,
  Calendar,
  ShieldCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import RifaDetailActions from "@/components/rifas/RifaDetailActions";
import { createClient } from "@/lib/supabase/server";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { Rifa, RifaStats } from "@/lib/types";

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
      .select(
        `id,creator_id,title,slug,description,prize_name,prize_image_url,
         prize_value,is_solidarity,cause_name,cause_description,cause_target,
         number_price,total_numbers,available_numbers,status,ends_at,draw_date,
         created_at,updated_at,
         creator:profiles!rifas_creator_id_fkey(id,full_name,avatar_url,country)`
      )
      .eq("id", id)
      .maybeSingle();

    if (rErr || !rifaRow) return null;

    const rifa = rifaRow as unknown as RifaLookupRow;
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
      const { data: rows } = await supabase
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
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRifaById(id);
  if (!result) {
    // Si usuario no auth y la rifa no se pudo cargar → /auth?redirectTo
    redirect(`/auth?redirectTo=${encodeURIComponent(`/rifas/${id}`)}`);
    return notFound();
  }

  const { rifa, stats, soldNumbers, mineNumbers, currentUserId } = result;
  if (rifa.status !== "active") {
    return notFound();
  }

  const soldOut = stats.available_numbers <= 0;
  const raised = stats.sold_numbers * stats.number_price;

  return (
    <div className="container max-w-content py-6 md:py-10">
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/rifas" className="hover:text-brand-rose transition">
          Rifas activas
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-medium truncate max-w-[20rem]">
          {rifa.title}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div
            className={cn(
              "relative aspect-[16/10] md:aspect-[16/9] rounded-2xl overflow-hidden shadow-[0_16px_50px_-18px_rgba(15,23,42,0.18)]",
              rifa.is_solidarity
                ? "bg-gradient-to-br from-brand-cyan via-cyan-500 to-brand-rose"
                : "bg-gradient-to-br from-brand-rose via-pink-500 to-brand-violet"
            )}
          >
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Badge
                variant={rifa.is_solidarity ? "solidarity" : "prize"}
                className="shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)]"
              >
                {rifa.is_solidarity ? (
                  <>
                    <Heart className="h-3 w-3 mr-1" /> Solidaria
                  </>
                ) : (
                  <>
                    <Gift className="h-3 w-3 mr-1" /> Premio
                  </>
                )}
              </Badge>
              {stats.sold_percentage >= 80 && (
                <Badge variant="destructive" className="!bg-rose-500 shadow-[0_8px_24px_-8px_rgba(255,27,81,0.45)]">
                  ¡Se agota!
                </Badge>
              )}
              {soldOut && (
                <Badge variant="closed">
                  <Award className="h-3 w-3 mr-1" /> Agotada
                </Badge>
              )}
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="!bg-white/15 !border-white/30 !text-white hover:!bg-white/25 backdrop-blur h-8 rounded-full"
              >
                <Share2 className="h-3.5 w-3.5 mr-1" /> Compartir
              </Button>
              {currentUserId && (
                <Badge variant="outline" className="!bg-white/20 !text-white !border-white/30 backdrop-blur">
                  {mineNumbers.size > 0 ? `🎟 ${mineNumbers.size} tuyos` : "Sesión iniciada"}
                </Badge>
              )}
            </div>

            <div className="absolute inset-0 grid place-items-center">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-[2rem] bg-white/20 backdrop-blur grid place-items-center text-6xl md:text-7xl shadow-2xl">
                {rifa.is_solidarity ? "💝" : "🏆"}
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
              <div className="text-white drop-shadow-sm">
                <div className="text-[11px] uppercase tracking-[0.2em] font-bold opacity-80">
                  Premio a sortear
                </div>
                <div className="mt-1 font-display font-black text-2xl md:text-4xl leading-tight tabular-nums">
                  {formatCurrency(rifa.prize_value)}
                </div>
              </div>
              {rifa.creator?.country && (
                <Badge
                  variant="outline"
                  className="!bg-white/15 !border-white/30 !text-white backdrop-blur"
                >
                  <MapPin className="h-3 w-3 mr-1" /> {rifa.creator.country}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="font-display font-black text-2xl md:text-3xl leading-[1.08] text-slate-900">
                  {rifa.title}
                </h1>
                {rifa.is_solidarity && rifa.cause_name && (
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-brand-cyan-800 bg-brand-cyan/10 border border-brand-cyan/20 px-3 py-1.5 rounded-xl">
                    <Heart className="h-4 w-4" />
                    <span className="font-bold">{rifa.cause_name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <Card className="border-slate-200 bg-white/60">
                <CardContent className="p-3 md:p-4 flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-brand-rose/10 grid place-items-center text-brand-rose">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Vendidos
                    </div>
                    <div className="font-display font-black text-lg text-slate-900 tabular-nums">
                      {stats.sold_numbers}/{stats.total_numbers}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white/60">
                <CardContent className="p-3 md:p-4 flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-brand-violet/10 grid place-items-center text-brand-violet">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Recaudado
                    </div>
                    <div className="font-display font-black text-lg text-slate-900 tabular-nums">
                      {formatCurrency(raised)}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white/60">
                <CardContent className="p-3 md:p-4 flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-brand-rose/10 grid place-items-center text-brand-rose">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Cierra
                    </div>
                    <div className="font-display font-black text-lg text-slate-900 tabular-nums">
                      {rifa.ends_at ? formatRelativeTime(rifa.ends_at) : "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white/60">
                <CardContent className="p-3 md:p-4 flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-brand-gold/10 grid place-items-center text-brand-gold">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Crea ·
                    </div>
                    <div className="font-bold text-sm text-slate-900 truncate">
                      {rifa.creator?.full_name ?? "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="numeros" className="w-full">
            <TabsList className="!bg-slate-100/70 !h-11 rounded-full p-1 grid grid-cols-4">
              <TabsTrigger
                value="descripcion"
                className="rounded-full data-[state=active]:!bg-white data-[state=active]:!text-slate-900 data-[state=active]:shadow-sm"
              >
                Descripción
              </TabsTrigger>
              <TabsTrigger
                value="numeros"
                className="rounded-full data-[state=active]:!bg-gradient-to-r data-[state=active]:from-brand-rose data-[state=active]:to-brand-violet data-[state=active]:!text-white data-[state=active]:shadow-cta"
              >
                Números
              </TabsTrigger>
              <TabsTrigger
                value="sorteo"
                className="rounded-full data-[state=active]:!bg-white data-[state=active]:!text-slate-900 data-[state=active]:shadow-sm"
              >
                Sorteo
              </TabsTrigger>
              <TabsTrigger
                value="creador"
                className="rounded-full data-[state=active]:!bg-white data-[state=active]:!text-slate-900 data-[state=active]:shadow-sm"
              >
                Creador
              </TabsTrigger>
            </TabsList>

            <TabsContent value="descripcion" className="mt-5 space-y-5 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-slate-200 bg-white/70">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Descripción del premio
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {rifa.description ?? rifa.prize_name}
                  </p>
                </CardContent>
              </Card>

              {rifa.is_solidarity && (rifa.cause_description || rifa.cause_target > 0) && (
                <Card className="border-brand-cyan/20 bg-gradient-to-br from-brand-cyan/5 via-white to-brand-rose/5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="solidarity">
                        <Heart className="h-3 w-3 mr-1" /> Causa solidaria
                      </Badge>
                      {rifa.cause_target > 0 && (
                        <Badge variant="outline" className="!border-cyan-200 !text-brand-cyan-700 !bg-cyan-50">
                          Meta: {formatCurrency(rifa.cause_target)}
                        </Badge>
                      )}
                    </div>
                    {rifa.cause_description && (
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {rifa.cause_description}
                      </p>
                    )}
                    {rifa.cause_target > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span>Progreso de la causa</span>
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
                          className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-cyan [&>div]:to-brand-rose [&>div]:rounded-full"
                        />
                        <div className="text-[11px] text-slate-400">
                          {formatCurrency(raised)} recaudados de{" "}
                          {formatCurrency(rifa.cause_target || 0)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="numeros" className="mt-5 focus-visible:outline-none focus-visible:ring-0">
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
              />
            </TabsContent>

            <TabsContent value="sorteo" className="mt-5 focus-visible:outline-none focus-visible:ring-0 space-y-4">
              <Card className="border-slate-200 bg-white/70">
                <CardContent className="p-5 grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-brand-gold/10 via-white to-brand-rose/5 border border-brand-gold/20 p-4 space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-brand-gold-700 font-bold">
                      Fecha del sorteo
                    </div>
                    <div className="font-display font-black text-2xl text-slate-900">
                      {rifa.draw_date
                        ? new Date(rifa.draw_date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })
                        : "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {rifa.draw_date
                        ? `Hora: ${new Date(rifa.draw_date).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })} (tu zona horaria)`
                        : ""}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-brand-rose/5 via-white to-brand-violet/5 border border-slate-200 p-4 space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-brand-violet font-bold">
                      Cierre de ventas
                    </div>
                    <div className="font-display font-black text-2xl text-slate-900">
                      {rifa.ends_at
                        ? new Date(rifa.ends_at).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })
                        : "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {rifa.ends_at ? `Faltan ${formatRelativeTime(rifa.ends_at)}` : ""}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white/70">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Cómo se realizará el sorteo
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(rifa as any).draw_instructions ??
                      "Sorteo público y transparente."}
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {[
                      { t: "Transmisión en vivo", icon: "📡" },
                      { t: "Testigos públicos", icon: "👥" },
                      { t: "Hash verificable", icon: "🔐" }
                    ].map((f) => (
                      <div
                        key={f.t}
                        className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center"
                      >
                        <div className="text-2xl">{f.icon}</div>
                        <div className="mt-1 text-[11px] text-slate-600 font-semibold">
                          {f.t}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="creador" className="mt-5 focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-slate-200 bg-white/70">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-brand-rose via-pink-500 to-brand-violet grid place-items-center text-white font-display font-black text-2xl shadow-[0_10px_30px_-12px_rgba(255,27,81,0.35)]">
                      {(rifa.creator?.full_name ?? "??")
                        .split(" ")
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() ?? "")
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-black text-xl text-slate-900 truncate">
                        {rifa.creator?.full_name ?? "Creador"}
                      </div>
                      {rifa.creator?.country && (
                        <div className="mt-0.5 text-sm text-slate-500 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> {rifa.creator.country}
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="h-9">
                      Ver perfil
                    </Button>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { k: "Rifas creadas", v: "12", c: "text-brand-rose" },
                      { k: "% Entregados", v: "100%", c: "text-brand-cyan" },
                      { k: "Valoración", v: "4.9 ★", c: "text-brand-gold" }
                    ].map((s) => (
                      <div key={s.k} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <div className={cn("font-display font-black text-xl tabular-nums", s.c)}>
                          {s.v}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{s.k}</div>
                      </div>
                    ))}
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
