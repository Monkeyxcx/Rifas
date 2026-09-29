"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Eye,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  Share2,
  Trophy
} from "lucide-react";
import { RifaCard } from "@/components/rifas/RifaCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showError, showSuccess } from "@/lib/ui/modals";
import type { Rifa, RifaStatus } from "@/lib/types";

export type CreadasItem = {
  rifa: Rifa;
  status: RifaStatus;
};

type TabKey = "todas" | "activas" | "cerradas" | "agotadas";

type Props = {
  items: CreadasItem[];
};

async function shareRifaLink(rifa: Rifa) {
  const url = `${window.location.origin}/rifas/${rifa.id}`;
  const title = rifa.title;

  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title, text: `Participa en: ${title}`, url });
      return;
    }
  } catch (err) {
    // User cancelled share sheet: do nothing
    if (err instanceof DOMException && err.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(url);
    void showSuccess({
      title: "Enlace copiado",
      message: "El link de la rifa quedó en tu portapapeles.",
      timer: 2200
    });
  } catch {
    void showError({
      title: "No se pudo copiar",
      message: `Copia este enlace manualmente: ${url}`
    });
  }
}

function matchesTab(item: CreadasItem, tab: TabKey): boolean {
  switch (tab) {
    case "activas":
      return item.status === "active";
    case "cerradas":
      return item.status === "closed";
    case "agotadas":
      return item.rifa.available_numbers === 0;
    default:
      return true;
  }
}

function matchesQuery(item: CreadasItem, q: string): boolean {
  if (!q) return true;
  const hay = [
    item.rifa.title,
    item.rifa.prize_name,
    item.rifa.slug ?? "",
    item.rifa.id,
    item.rifa.cause_name ?? ""
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export default function CreadasRifasList({ items }: Props) {
  const [tab, setTab] = useState<TabKey>("todas");
  const [query, setQuery] = useState("");

  const tabs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? items.filter((i) => matchesQuery(i, q)) : items;
    return [
      { v: "todas" as const, label: "Todas", count: base.length },
      {
        v: "activas" as const,
        label: "Activas",
        count: base.filter((i) => matchesTab(i, "activas")).length
      },
      {
        v: "cerradas" as const,
        label: "Cerradas",
        count: base.filter((i) => matchesTab(i, "cerradas")).length
      },
      {
        v: "agotadas" as const,
        label: "Agotadas",
        count: base.filter((i) => matchesTab(i, "agotadas")).length
      }
    ];
  }, [items, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => matchesTab(i, tab) && matchesQuery(i, q));
  }, [items, tab, query]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabKey)}
          className="w-full md:w-auto"
        >
          <TabsList className="!bg-slate-100/70 !h-11 rounded-full p-1 flex md:inline-flex w-full overflow-x-auto">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="rounded-full whitespace-nowrap data-[state=active]:!bg-gradient-cta data-[state=active]:!text-white data-[state=active]:shadow-cta"
              >
                {t.label}
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 px-1.5 py-0 text-[10px] font-bold"
                >
                  {t.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-rose" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar rifa, premio, código..."
            className="h-11 pl-10 placeholder:text-slate-400"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed-2 border-slate-300 bg-white py-20 text-center">
          <CardContent className="mx-auto max-w-md">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-rose to-brand-violet text-white shadow-cta">
              <Trophy className="h-8 w-8" strokeWidth={2.2} />
            </div>
            <h3 className="font-display text-xl font-black text-slate-900">
              Todavía no creaste ninguna rifa
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Empieza con una rifa solidaria para probar, o crea la tuya y gana exposición
              instantánea en la página principal.
            </p>
            <Button asChild size="lg" className="mt-5 h-12 font-black w-full md:w-auto">
              <Link href="/rifas/crear">
                <Plus className="mr-1.5 h-5 w-5" />
                Crear mi primera rifa
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white py-14 text-center">
          <CardContent>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Sin resultados
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Prueba otro filtro o limpia la búsqueda.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setTab("todas");
                setQuery("");
              }}
            >
              Ver todas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ rifa, status }) => (
            <div key={rifa.id} className="flex flex-col gap-2">
              <div className="relative">
                <RifaCard
                  rifa={rifa}
                  stats={{
                    rifa_id: rifa.id,
                    total_numbers: rifa.total_numbers,
                    available_numbers: rifa.available_numbers,
                    sold_numbers: rifa.total_numbers - rifa.available_numbers,
                    sold_percentage:
                      rifa.total_numbers > 0
                        ? Math.round(
                            ((rifa.total_numbers - rifa.available_numbers) /
                              rifa.total_numbers) *
                              100
                          )
                        : 0,
                    number_price: rifa.number_price,
                    status,
                    created_at: rifa.created_at,
                    ends_at: rifa.ends_at,
                    draw_date: rifa.draw_date
                  }}
                />
                {status === "closed" && (
                  <div className="pointer-events-none absolute left-3 top-3 z-10">
                    <Badge variant="closed" className="shadow">
                      <CalendarDays className="mr-1 h-3 w-3" />
                      Finalizada
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 justify-center border-slate-200 bg-white text-slate-700 shadow-sm"
                  asChild
                >
                  <Link href={`/rifas/${rifa.id}`}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Preview
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 justify-center border-slate-200 bg-white text-slate-700 shadow-sm"
                  asChild
                >
                  <Link href={`/rifas/crear?editar=${rifa.id}`}>
                    <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 justify-center border-brand-rose/40 bg-white text-brand-rose shadow-sm"
                  type="button"
                  onClick={() => void shareRifaLink(rifa)}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Compartir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 justify-center border-emerald-300 bg-white text-emerald-700 shadow-sm"
                  asChild
                >
                  <Link href={`/mis-rifas/comprobantes-nequi/${rifa.id}`}>
                    <ReceiptText className="mr-1.5 h-3.5 w-3.5" />
                    Comprobantes
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
