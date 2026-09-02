import { MOCK_RIFAS } from "@/components/rifas/MOCK_RIFAS";
import { RifaCard } from "@/components/rifas/RifaCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Rifa, RifaStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Eye,
  Plus,
  Search,
  Settings2,
  Share2,
  Trophy,
  UsersRound
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

function pickMisCreadas(): Array<{ rifa: Rifa; status: RifaStatus }> {
  const raw = MOCK_RIFAS.slice(0, 3).map((r, idx) => ({
    rifa: r.rifa,
    status: (idx === 2 ? "closed" : r.rifa.status) as RifaStatus
  }));
  return raw;
}

export default function MisRifasCreadasPage() {
  const creadas = pickMisCreadas();
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
  const country = creadas[0]?.rifa.creator?.country ?? "Colombia";

  const tabs: Array<{ v: string; label: string; count: number }> = [
    { v: "todas", label: "Todas", count: creadas.length },
    { v: "activas", label: "Activas", count: rifasActivas },
    { v: "cerradas", label: "Cerradas", count: creadas.filter((c) => c.status === "closed").length },
    { v: "agotadas", label: "Agotadas", count: creadas.filter((c) => c.rifa.available_numbers === 0).length }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto max-w-7xl px-4 py-10 lg:py-12">
        {/* HEADER gradient */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-rose via-brand-violet to-brand-cyan p-7 lg:p-10 text-white shadow-xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
              backgroundSize: "20px 20px"
            }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge className="!bg-white !bg-opacity-95 !text-brand-rose !border-0 mb-3 shadow">
                <Trophy className="mr-1.5 h-3 w-3" />
                Panel de creador · {country}
              </Badge>
              <h1 className="font-display text-3xl font-black tracking-tight lg:text-4xl">
                Mis rifas creadas
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/85 lg:text-base">
                Administra tus sorteos: edita detalles, comparte, revisa estadísticas de ventas
                y sigue el progreso en tiempo real. 💫
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="group h-12 !bg-white !text-brand-rose hover:!bg-white/90 shadow-cta shadow-black/10"
            >
              <Link href="/rifas/crear" className="flex items-center gap-2 font-black">
                <Plus className="h-5 w-5 transition group-hover:rotate-90" strokeWidth={2.4} />
                + Crear nueva rifa
              </Link>
            </Button>
          </div>
        </div>

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
                {creadas.length} rifa{creadas.length === 1 ? "" : "s"} · Impuestos y comisiones aplicadas
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
                +18 esta semana
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="font-numbers text-3xl font-black tabular-nums tracking-tight text-brand-rose">
                {totalVendidos.toLocaleString("es-CO")}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {Math.round(
                  (totalVendidos /
                    creadas.reduce((acc, c) => acc + c.rifa.total_numbers, 0)) *
                    100
                )}
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
                Cierre prom 12d
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

        {/* TABS + BUSCAR */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs defaultValue="todas" className="w-full md:w-auto">
            <TabsList className="!bg-slate-100/70 !h-11 rounded-full p-1 flex md:inline-flex w-full overflow-x-auto">
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="rounded-full whitespace-nowrap data-[state=active]:!bg-gradient-to-r data-[state=active]:from-brand-rose data-[state=active]:to-brand-violet data-[state=active]:!text-white data-[state=active]:shadow-cta"
                >
                  {t.label}
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 py-0 text-[10px] font-bold">
                    {t.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-rose" />
            <Input
              placeholder="Buscar rifa, premio, código..."
              className="h-11 pl-10 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* GRID RIFASCARD + ACTION BUTTONS OVERLAY */}
        {creadas.length === 0 ? (
          <Card className="border-dashed-2 border-slate-300 bg-white py-20 text-center">
            <CardContent className="mx-auto max-w-md">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-rose to-brand-violet text-white shadow-cta">
                <Trophy className="h-8 w-8" strokeWidth={2.2} />
              </div>
              <h3 className="font-display text-xl font-black text-slate-900">
                ¡Todavía no creaste ninguna rifa!
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Empieza con una rifa solidaria para probar, o crea la tuya y gana exposición
                instantánea en la página principal. 🚀
              </p>
              <Button asChild size="lg" className="mt-5 h-12 font-black w-full md:w-auto">
                <Link href="/rifas/crear">
                  <Plus className="mr-1.5 h-5 w-5" />
                  Crear mi primera rifa
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {creadas.map(({ rifa, status }) => (
              <div key={rifa.id} className="group relative">
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
                <div className="absolute bottom-3 right-3 z-10 flex translate-y-1 items-center gap-1.5 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="!bg-white !h-9 !border-slate-200 !text-slate-700 shadow"
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="!bg-white !h-9 !border-slate-200 !text-slate-700 shadow"
                  >
                    <Settings2 className="mr-1 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="!bg-white !h-9 !border-brand-rose/40 !text-brand-rose shadow"
                  >
                    <Share2 className="mr-1 h-3.5 w-3.5" />
                    Compartir
                  </Button>
                </div>
                {status === "closed" && (
                  <div className="pointer-events-none absolute left-3 top-3 z-10">
                    <Badge variant="closed" className="shadow">
                      <CalendarDays className="mr-1 h-3 w-3" />
                      Finalizada
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
