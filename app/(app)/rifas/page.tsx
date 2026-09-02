"use client";

import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Ticket,
  Heart,
  Trophy,
  TrendingUp,
  Clock,
  Sparkles,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RifaCard } from "@/components/rifas/RifaCard";
import { MOCK_RIFAS } from "@/components/rifas/MOCK_RIFAS";
import { cn, formatCurrency } from "@/lib/utils";

type SortKey = "trending" | "ending" | "newest" | "cheapest";
type FilterTab = "all" | "solidarity" | "premium";

export default function RifasListPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("trending");
  const [tab, setTab] = useState<FilterTab>("all");
  const [maxPrice, setMaxPrice] = useState<number>(0);

  const maxPriceAvailable = useMemo(() => {
    const max = Math.max(...MOCK_RIFAS.map((x) => x.rifa.number_price));
    return max;
  }, []);

  const filtered = useMemo(() => {
    let list = [...MOCK_RIFAS];

    if (tab === "solidarity")
      list = list.filter((x) => x.rifa.is_solidarity);
    if (tab === "premium")
      list = list.filter(
        (x) => !x.rifa.is_solidarity && x.rifa.prize_value >= 5_000_000
      );

    if (query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        ({ rifa }) =>
          rifa.title.toLowerCase().includes(q) ||
          rifa.prize_name.toLowerCase().includes(q) ||
          (rifa.cause_name ?? "").toLowerCase().includes(q) ||
          (rifa.creator?.full_name ?? "")
            .toLowerCase()
            .includes(q)
      );
    }

    if (maxPrice > 0) {
      list = list.filter((x) => x.rifa.number_price <= maxPrice);
    }

    switch (sort) {
      case "trending":
        list.sort((a, b) => b.stats.sold_percentage - a.stats.sold_percentage);
        break;
      case "ending":
        list.sort(
          (a, b) =>
            new Date(a.rifa.ends_at ?? "").getTime() -
            new Date(b.rifa.ends_at ?? "").getTime()
        );
        break;
      case "newest":
        list.sort(
          (a, b) =>
            new Date(b.rifa.created_at).getTime() -
            new Date(a.rifa.created_at).getTime()
        );
        break;
      case "cheapest":
        list.sort((a, b) => a.rifa.number_price - b.rifa.number_price);
        break;
    }

    return list;
  }, [query, sort, tab, maxPrice]);

  const stats = useMemo(() => {
    const totalRifas = MOCK_RIFAS.length;
    const totalSolidarity = MOCK_RIFAS.filter(
      (x) => x.rifa.is_solidarity
    ).length;
    const totalRaised = MOCK_RIFAS.reduce(
      (acc, { rifa, stats }) =>
        acc + stats.sold_numbers * rifa.number_price,
      0
    );
    const totalNumbersSold = MOCK_RIFAS.reduce(
      (acc, { stats }) => acc + stats.sold_numbers,
      0
    );
    return { totalRifas, totalSolidarity, totalRaised, totalNumbersSold };
  }, []);

  return (
    <div className="relative pb-16">
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
                  {stats.totalRifas} rifas activas en este momento
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
                    {formatCurrency(stats.totalRaised)}
                  </div>
                </div>
                <div className="rounded-xl bg-white/80 backdrop-blur px-4 py-3 shadow-sm border border-slate-200/80 min-w-[140px]">
                  <div className="inline-flex items-center gap-1 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <Ticket className="h-3.5 w-3.5 text-brand-cyan" />
                    Nros vendidos
                  </div>
                  <div className="font-display font-extrabold text-slate-900 text-lg">
                    {stats.totalNumbersSold.toLocaleString("es-419")}
                  </div>
                </div>
              </div>
            </div>

            {/* Buscador */}
            <div className="relative mt-1 max-w-3xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-brand-rose transition-colors" />
              <Input
                placeholder="Busca un premio, causa solidaria o creador…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 pl-11 pr-12 rounded-2xl border-slate-200 bg-white shadow-sm text-base focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose/60"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Filtros ===== */}
      <div className="container max-w-content mt-6 md:mt-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <Tabs
            defaultValue={tab}
            onValueChange={(v) => setTab(v as FilterTab)}
            className="w-full"
          >
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
                Solidarias <span className="ml-1.5 opacity-75 text-xs">({stats.totalSolidarity})</span>
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
                variant={sort === k ? "default" : "outline"}
                className={cn(
                  "h-8 rounded-xl",
                  sort === k
                    ? "bg-gradient-cta shadow-cta border-0 text-white"
                    : "text-slate-700"
                )}
                onClick={() => setSort(k)}
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
                value={maxPrice || maxPriceAvailable}
                onChange={(e) =>
                  setMaxPrice(
                    Number(e.target.value) >= maxPriceAvailable
                      ? 0
                      : Number(e.target.value)
                  )
                }
                className="w-full accent-brand-rose cursor-pointer"
              />
            </div>
            <div className="text-sm font-display font-extrabold text-slate-900 min-w-[110px] text-right">
              Hasta{" "}
              {formatCurrency(
                maxPrice > 0 ? maxPrice : maxPriceAvailable
              )}
            </div>
            {maxPrice > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg px-2 text-slate-500"
                onClick={() => setMaxPrice(0)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-8 bg-slate-200/80" />

        {/* ===== Resultados ===== */}
        {filtered.length === 0 ? (
          <div className="py-20 grid place-items-center">
            <div className="max-w-md text-center space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-rose/10 text-brand-rose">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="font-display text-xl font-bold">
                No encontramos rifas para tu búsqueda
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Intenta con otro premio, una causa distinta o quita algunos
                filtros. Siempre hay nuevas rifas entrando a la plataforma.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" onClick={() => {
                  setQuery("");
                  setTab("all");
                  setSort("trending");
                  setMaxPrice(0);
                }}>
                  <X className="h-4 w-4" />
                  Quitar filtros
                </Button>
                <Button
                  asChild
                  variant="gradient"
                >
                  <a href="/rifas/crear">
                    <Ticket className="h-4 w-4" />
                    Crear la mía
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-slate-900 text-lg">
                {filtered.length} rifa{filtered.length === 1 ? "" : "s"} coincidente
                {filtered.length === 1 ? "" : "s"}
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
                    }[sort]
                  }
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
              {filtered.map(({ rifa, stats: st }) => (
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
