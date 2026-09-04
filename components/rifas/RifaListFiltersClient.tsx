"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import type { Rifa, RifaStats } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type SortKey = "trending" | "ending" | "newest" | "cheapest";

export type RifaWithStats = {
  rifa: Rifa;
  stats: RifaStats;
};

type Props = {
  allRifas: RifaWithStats[];
  initialQuery: string;
  initialTab: string;
  initialSort: SortKey;
  initialMaxPrice: number;
  maxPriceAvailable: number;
  totalRifas: number;
  totalSolidarity: number;
  totalRaised: number;
  totalNumbersSold: number;
};

function qsPush(params: Record<string, string | number | undefined>) {
  const current = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === "" || v === null) current.delete(k);
    else current.set(k, String(v));
  });
  const qs = current.toString();
  return qs ? `?${qs}` : window.location.pathname;
}

export default function RifaListFiltersClient(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState<string>(props.initialQuery);
  const [tab, setTab] = useState<string>(props.initialTab);
  const [sort, setSort] = useState<SortKey>(props.initialSort);
  const [maxPrice, setMaxPrice] = useState<number>(
    props.initialMaxPrice || props.maxPriceAvailable
  );

  useEffect(() => {
    setQuery(props.initialQuery);
    setTab(props.initialTab);
    setSort(props.initialSort);
    setMaxPrice(props.initialMaxPrice || props.maxPriceAvailable);
  }, [props.initialQuery, props.initialTab, props.initialSort, props.initialMaxPrice, props.maxPriceAvailable]);

  useEffect(() => {
    const newQ = searchParams.get("q") ?? "";
    const newT = searchParams.get("tab") ?? "all";
    const newS = (searchParams.get("sort") as SortKey) ?? "trending";
    const newM = Number(searchParams.get("max") ?? 0) || 0;
    setQuery(newQ);
    setTab(newT);
    setSort(newS);
    setMaxPrice(newM || props.maxPriceAvailable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const syncURL = (p: { q?: string; tab?: string; sort?: SortKey; max?: number }) => {
    const nextQ = p.q !== undefined ? p.q : query;
    const nextT = p.tab !== undefined ? p.tab : tab;
    const nextS = p.sort !== undefined ? p.sort : sort;
    const nextM = p.max !== undefined ? p.max : maxPrice;

    const finalMax =
      nextM && nextM < props.maxPriceAvailable ? Math.round(nextM / 1000) * 1000 : undefined;

    router.push(
      qsPush({
        q: nextQ.trim() || undefined,
        tab: nextT === "all" ? undefined : nextT,
        sort: nextS === "trending" ? undefined : nextS,
        max: finalMax
      }),
      { scroll: false }
    );
  };

  const filteredRifas = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = props.allRifas.slice();

    if (tab === "solidarity") {
      list = list.filter(({ rifa }) => Boolean(rifa.is_solidarity));
    } else if (tab === "premium") {
      list = list.filter(({ rifa }) => Number(rifa.prize_value || 0) >= 1_000_000);
    }
    if (maxPrice > 0) {
      list = list.filter(({ stats }) => Number(stats.number_price || 0) <= maxPrice);
    }
    if (q.length > 0) {
      list = list.filter(({ rifa }) => {
        const creatorName =
          (rifa.creator as unknown as { full_name?: string })?.full_name?.toLowerCase() ?? "";
        const haystack = [
          rifa.title,
          rifa.description,
          rifa.prize_name,
          rifa.cause_name,
          rifa.cause_description,
          creatorName
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    list.sort((a, b) => {
      switch (sort) {
        case "cheapest":
          return a.stats.number_price - b.stats.number_price;
        case "newest":
          return new Date(b.stats.created_at || 0).getTime() - new Date(a.stats.created_at || 0).getTime();
        case "ending": {
          const ad = a.stats.ends_at ? new Date(a.stats.ends_at).getTime() : Infinity;
          const bd = b.stats.ends_at ? new Date(b.stats.ends_at).getTime() : Infinity;
          return ad - bd;
        }
        case "trending":
        default:
          return b.stats.sold_percentage - a.stats.sold_percentage;
      }
    });

    return list;
  }, [props.allRifas, query, tab, sort, maxPrice]);

  const clearAll = () => {
    setQuery("");
    setTab("all");
    setSort("trending");
    setMaxPrice(props.maxPriceAvailable);
    router.push(window.location.pathname, { scroll: false });
  };

  const hasActiveFilters =
    query.trim().length > 0 || tab !== "all" || sort !== "trending" || maxPrice < props.maxPriceAvailable;

  return (
    <div className="relative pb-16">
      {/* Header */}
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
                  {props.totalRifas} rifa{props.totalRifas === 1 ? "" : "s"} activa
                  {props.totalRifas === 1 ? "" : "s"} en este momento
                </Badge>
                <h1 className="font-display font-black tracking-tight text-3xl md:text-4xl leading-tight">
                  Explora y participa en rifas de{" "}
                  <span className="bg-gradient-to-r from-brand-rose via-fuchsia-500 to-brand-violet bg-clip-text text-transparent">
                    premios increíbles
                  </span>{" "}
                  o causas solidarias
                </h1>
                <p className="mt-3 text-slate-600 max-w-2xl leading-relaxed">
                  Busca por el premio que te apasione, la causa que quieras apoyar o el
                  precio de número que prefieras. Pago seguro con Mercado Pago.
                </p>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="rounded-xl bg-white/80 backdrop-blur px-4 py-3 shadow-sm border border-slate-200/80 min-w-[140px]">
                  <div className="inline-flex items-center gap-1 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <Trophy className="h-3.5 w-3.5 text-brand-gold" />
                    Recaudado
                  </div>
                  <div className="font-display font-extrabold text-slate-900 text-lg">
                    {formatCurrency(props.totalRaised)}
                  </div>
                </div>
                <div className="rounded-xl bg-white/80 backdrop-blur px-4 py-3 shadow-sm border border-slate-200/80 min-w-[140px]">
                  <div className="inline-flex items-center gap-1 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <Ticket className="h-3.5 w-3.5 text-brand-cyan" />
                    Nros vendidos
                  </div>
                  <div className="font-display font-extrabold text-slate-900 text-lg">
                    {props.totalNumbersSold.toLocaleString("es-419")}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-1 max-w-3xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-brand-rose transition-colors" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  syncURL({ q: e.target.value });
                }}
                name="q"
                placeholder="Busca un premio, causa solidaria o creador…"
                className="h-12 pl-11 pr-12 rounded-2xl border-slate-200 bg-white shadow-sm text-base focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose/60"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => syncURL({ q: "" })}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="container max-w-content mt-6 md:mt-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <Tabs value={tab} onValueChange={(v) => syncURL({ tab: v })} className="w-full">
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
                Solidarias <span className="ml-1.5 opacity-75 text-xs">({props.totalSolidarity})</span>
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
                onClick={() => syncURL({ sort: k })}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {label}
              </Button>
            ))}
            {hasActiveFilters && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 rounded-xl text-slate-500 hover:text-brand-rose"
                onClick={clearAll}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur px-5 py-3.5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Precio número
          </div>
          <div className="flex flex-1 items-center gap-3 min-w-[260px]">
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={props.maxPriceAvailable}
                step={1000}
                value={maxPrice}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMaxPrice(v);
                  syncURL({ max: v });
                }}
                className="w-full accent-brand-rose cursor-pointer"
              />
            </div>
            <div className="text-sm font-display font-extrabold text-slate-900 min-w-[110px] text-right">
              Hasta {formatCurrency(maxPrice)}
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-slate-200/80" />

        {props.allRifas.length === 0 ? (
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
        ) : filteredRifas.length === 0 ? (
          <div className="py-20 grid place-items-center">
            <div className="max-w-md text-center space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="font-display text-xl font-bold">
                No encontramos rifas con estos filtros
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Prueba borrando la búsqueda, aumentando el rango de precio o
                seleccionando otra categoría.
              </p>
              <Button variant="outline" onClick={clearAll}>
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <h2 className="font-display font-bold text-slate-900 text-lg">
                {filteredRifas.length} rifa{filteredRifas.length === 1 ? "" : "s"} disponible
                {filteredRifas.length === 1 ? "" : "s"}
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
              {filteredRifas.map(({ rifa, stats: st }) => (
                <RifaCard key={rifa.id} rifa={rifa} stats={st} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
