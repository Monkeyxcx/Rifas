import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Ticket,
  Heart,
  Trophy,
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RifaCard } from "@/components/rifas/RifaCard";
import { createClient } from "@/lib/supabase/server";
import { cn, formatCurrency } from "@/lib/utils";
import type { Rifa, RifaStats } from "@/lib/types";

type SortKey = "trending" | "ending" | "newest" | "cheapest";

type RifaWithStats = {
  rifa: Rifa;
  stats: RifaStats;
};

async function getActiveRifas(): Promise<RifaWithStats[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("rifas")
      .select(
        `id,creator_id,title,slug,description,prize_name,prize_image_url,
         prize_value,is_solidarity,cause_name,cause_description,cause_target,
         number_price,total_numbers,available_numbers,status,ends_at,draw_date,
         created_at,updated_at,
         creator:profiles!rifas_creator_id_fkey(id,full_name,avatar_url,country)`
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) return [];
    return (data as Rifa[]).map((row) => {
      const total = Number(row.total_numbers) || 0;
      const avail = Number(row.available_numbers) ?? total;
      const sold = Math.max(0, total - avail);
      const soldPct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
      return {
        rifa: row as Rifa,
        stats: {
          rifa_id: row.id,
          total_numbers: total,
          sold_numbers: sold,
          available_numbers: avail,
          sold_percentage: soldPct,
          number_price: Number(row.number_price) || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: row.status as any,
          created_at: row.created_at as string,
          ends_at: (row.ends_at as string | null) ?? null,
          draw_date: (row.draw_date as string | null) ?? null
        } as RifaStats
      };
    });
  } catch (e) {
    console.error("[rifas] fetch real failed", e);
    return [];
  }
}

export default async function RifasListPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; tab?: string; sort?: string; max?: string }>;
}) {
  const raw = await searchParams;
  const initialQuery = raw.q ?? "";
  const initialTab: string = raw.tab ?? "all";
  const initialSort: SortKey =
    (raw.sort as SortKey) ?? "trending";
  const initialMaxPrice = Number(raw.max ?? 0) || 0;

  const allRifas = await getActiveRifas();

  // Stats agregadas para header (server side, no filtros)
  const totalRifas = allRifas.length;
  const totalSolidarity = allRifas.filter((x) => x.rifa.is_solidarity).length;
  const totalRaised = allRifas.reduce(
    (acc, { rifa, stats }) =>
      acc + stats.sold_numbers * Number(rifa.number_price || 0),
    0
  );
  const totalNumbersSold = allRifas.reduce(
    (acc, { stats }) => acc + stats.sold_numbers,
    0
  );
  const maxPriceAvailable =
    allRifas.length > 0
      ? Math.max(...allRifas.map((x) => Number(x.rifa.number_price) || 0))
      : 100_000;

  return (
    <div className="relative pb-16" data-server-prefill='JSON.stringify({initialQuery,initialTab,initialSort,initialMaxPrice,maxPriceAvailable})'>
      {/* ===== Header + Búsqueda ===== */}
      <div
        className="relative overflow-hidden border-b border-slate-200/70"
        style={{
          background:
            "linear-gradient(180deg, hsla(348, 97%, 62%, 0.08), hsla(0,0%,100%,0) 60%), radial-gradient(circle at 80% 0%, hsla(270,95%,60%,0.1), transparent 45%)"
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 20%, hsla(348,97%,62%,0.16) 0, transparent 45%)"
          }}
        />
        <div className="container max-w-content py-10 md:py-14 relative">
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <Badge variant="active" className="mb-3 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {totalRifas} rifa{totalRifas === 1 ? "" : "s"} activa
                  {totalRifas === 1 ? "" : "s"} en este momento
                </Badge>
                <h1 className="font-display font-black tracking-tight text-3xl md:text-4xl leading-tight">
                  Explora y participa en rifas de{" "}
                  <span className="bg-gradient-to-r from-brand-rose via-fuchsia-500 to-brand-violet bg-clip-text text-transparent">
                    premios increíbles
                  </span>{" "}
                  o causas solidarias
                </h1>
                <p className="mt-3 text-slate-600 max-w-2xl leading-relaxed">
                  Busca por el premio que te apasione, la causa que quieras apoyar o
                  el precio de número que prefieras. Pago seguro con Mercado Pago.
                </p>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="rounded-xl bg-white/80 backdrop-blur px-4 py-3 shadow-sm border border-slate-200/80 min-w-[140px]">
                  <div className="inline-flex items-center gap-1 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <Trophy className="h-3.5 w-3.5 text-brand-gold" />
                    Recaudado
                  </div>
                  <div className="font-display font-extrabold text-slate-900 text-lg">
                    {formatCurrency(totalRaised)}
                  </div>
                </div>
                <div className="rounded-xl bg-white/80 backdrop-blur px-4 py-3 shadow-sm border border-slate-200/80 min-w-[140px]">
                  <div className="inline-flex items-center gap-1 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <Ticket className="h-3.5 w-3.5 text-brand-cyan" />
                    Nros vendidos
                  </div>
                  <div className="font-display font-extrabold text-slate-900 text-lg">
                    {totalNumbersSold.toLocaleString("es-419")}
                  </div>
                </div>
              </div>
            </div>

            {/* Buscador */}
            <div className="relative mt-1 max-w-3xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-brand-rose transition-colors" />
              <Input
                defaultValue={initialQuery}
                name="q"
                placeholder="Busca un premio, causa solidaria o creador…"
                className="h-12 pl-11 pr-12 rounded-2xl border-slate-200 bg-white shadow-sm text-base focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose/60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Filtros ===== */}
      <div className="container max-w-content mt-6 md:mt-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="inline-flex rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-1 shadow-sm">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-rose data-[state=active]:to-brand-violet data-[state=active]:text-white rounded-xl h-9 px-4"
              >
                <Ticket className="h-4 w-4 mr-1.5" />
                Todas
              </TabsTrigger>
              <TabsTrigger
                value="solidarity"
                className="data-[state=active]:bg-gradient-solidario data-[state=active]:text-white rounded-xl h-9 px-4"
              >
                <Heart className="h-4 w-4 mr-1.5" fill="currentColor" />
                Solidarias <span className="ml-1.5 opacity-75 text-xs">({totalSolidarity})</span>
              </TabsTrigger>
              <TabsTrigger
                value="premium"
                className="data-[state=active]:bg-gradient-premio data-[state=active]:text-slate-900 rounded-xl h-9 px-4"
              >
                <Trophy className="h-4 w-4 mr-1.5" />
                Grandes premios
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
              <SlidersHorizontal className="h-4 w-4" />
              Ordenar:
            </span>
            {(
              [
                { k: "trending", label: "Tendencia", icon: TrendingUp },
                { k: "ending", label: "Cierran pronto", icon: Clock },
                { k: "newest", label: "Nuevas", icon: Sparkles },
                { k: "cheapest", label: "Económicas", icon: Ticket }
              ] as Array<{ k: SortKey; label: string; icon: typeof TrendingUp }>
            ).map(({ k, label, icon: Icon }) => (
              <Button
                key={k}
                size="sm"
                variant={initialSort === k ? "default" : "outline"}
                className={cn(
                  "h-8 rounded-xl",
                  initialSort === k
                    ? "bg-gradient-cta shadow-cta border-0 text-white"
                    : "text-slate-700"
                )}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Filtro precio range  */}
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur px-5 py-3.5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Precio número
          </div>
          <div className="flex flex-1 items-center gap-3 min-w-[260px]">
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={maxPriceAvailable}
                step={1000}
                defaultValue={initialMaxPrice || maxPriceAvailable}
                className="w-full accent-brand-rose cursor-pointer"
              />
            </div>
            <div className="text-sm font-display font-extrabold text-slate-900 min-w-[110px] text-right">
              Hasta{" "}
              {formatCurrency(
                initialMaxPrice > 0 ? initialMaxPrice : maxPriceAvailable
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-slate-200/80" />

        {/* ===== Resultados ===== */}
        {allRifas.length === 0 ? (
          <div className="py-20 grid place-items-center">
            <div className="max-w-md text-center space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-rose/10 text-brand-rose">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="font-display text-xl font-bold">
                No hay rifas activas en este momento
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Sé el primero en crear una rifa y gana premios o apoya una causa
                solidaria.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button asChild variant="gradient">
                  <Link href="/rifas/crear">
                    <Ticket className="h-4 w-4" />
                    Crear la mía
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-slate-900 text-lg">
                {allRifas.length} rifa{allRifas.length === 1 ? "" : "s"} disponible
                {allRifas.length === 1 ? "" : "s"}
              </h2>
              <div className="text-xs text-slate-500">
                Ordenado por{" "}
                <span className="font-semibold text-slate-800">
                  {
                    {
                      trending: "tendencia (mayor % vendido)",
                      ending: "fecha de cierre (más cercano)",
                      newest: "más nuevas primero",
                      cheapest: "precio número (asc)"
                    }[initialSort]
                  }
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
              {allRifas.map(({ rifa, stats: st }) => (
                <RifaCard
                  key={rifa.id}
                  rifa={rifa}
                  stats={st}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
