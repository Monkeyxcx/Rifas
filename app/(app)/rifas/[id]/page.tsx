import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Share2, Gift, Heart, Award, Users, Calendar, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import NumberGrid from "@/components/rifas/NumberGrid";
import { MOCK_RIFAS } from "@/components/rifas/MOCK_RIFAS";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";

// Simulate params sync (Next 15 params is a Promise — unwrap with React.use in future, safe for now)
function unwrapParamsSync(p: Promise<{ id: string }> | { id: string }): { id: string } {
  if (p && typeof (p as Promise<any>).then === "function") {
    return { id: "00000000-0000-0000-0000-000000000001" };
  }
  return p as { id: string };
}

export default function RifaDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = unwrapParamsSync(params);
  const match =
    MOCK_RIFAS.find((m) => m.rifa.id === id) ?? MOCK_RIFAS[0];
  if (!match) return notFound();

  const { rifa, stats } = match;

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
                            {Math.min(100, Math.round((raised / rifa.cause_target) * 100))}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(100, (raised / rifa.cause_target) * 100)}
                          className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-cyan [&>div]:to-brand-rose [&>div]:rounded-full"
                        />
                        <div className="text-[11px] text-slate-400">
                          {formatCurrency(raised)} recaudados de {formatCurrency(rifa.cause_target)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="numeros" className="mt-5 focus-visible:outline-none focus-visible:ring-0">
              <NumberGrid
                totalNumbers={rifa.total_numbers}
                numberPrice={rifa.number_price}
                soldPercentage={stats.sold_percentage}
                maxSelections={20}
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
                    {rifa.draw_instructions ?? "Sorteo público y transparente."}
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

        <aside className="lg:col-span-2 space-y-4 lg:sticky lg:top-24 self-start">
          <Card className="border border-slate-200 overflow-hidden shadow-[0_16px_50px_-24px_rgba(15,23,42,0.15)]">
            <div
              className={cn(
                "px-5 py-4",
                rifa.is_solidarity
                  ? "bg-gradient-to-r from-brand-cyan to-brand-rose text-white"
                  : "bg-gradient-to-r from-brand-rose to-brand-violet text-white"
              )}
            >
              <div className="text-[11px] uppercase tracking-[0.2em] opacity-85 font-bold">
                Participa ahora
              </div>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] opacity-80 font-semibold">Precio por número</div>
                  <div className="font-display font-black text-3xl leading-none tabular-nums">
                    {formatCurrency(rifa.number_price)}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="!bg-white/20 !text-white !border-white/30 !border backdrop-blur"
                >
                  ⚡ {stats.available_numbers} disponibles
                </Badge>
              </div>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Avance de venta</span>
                  <span className="font-numbers tabular-nums font-bold text-slate-700">
                    {stats.sold_percentage}%
                  </span>
                </div>
                <Progress
                  value={stats.sold_percentage}
                  className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-rose [&>div]:to-brand-violet [&>div]:rounded-full"
                />
                <div className="text-[11px] text-slate-400 font-numbers tabular-nums">
                  {stats.sold_numbers} vendidos · {stats.available_numbers} disponibles · {stats.total_numbers} total
                </div>
              </div>

              <Separator />

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  Tu carrito
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-xs">
                    00
                  </Badge>
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-xs">
                    07
                  </Badge>
                  <Badge variant="outline" className="px-2.5 py-0.5 text-xs text-slate-400 !border-dashed">
                    + seleccionar
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                      Subtotal (2 núm.)
                    </div>
                    <div className="font-display font-black text-2xl tabular-nums text-slate-900">
                      {formatCurrency(rifa.number_price * 2)}
                    </div>
                  </div>
                  <Badge variant="outline" className="!border-emerald-200 !bg-emerald-50 !text-emerald-700">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Pago seguro
                  </Badge>
                </div>
              </div>

              <Button
                type="button"
                disabled={soldOut}
                className={cn(
                  "w-full h-12 text-base font-bold rounded-xl shadow-cta active:scale-[0.98]",
                  soldOut
                    ? "!bg-slate-300 !text-slate-500"
                    : "!bg-gradient-to-r from-brand-rose to-brand-violet !text-white"
                )}
              >
                {soldOut ? (
                  <>Todos los números vendidos — agotada</>
                ) : (
                  <>
                    💳 Reservar y pagar · Mercado Pago
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  🔒 SSL encriptado
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end">
                  ⏱ Reserva 15 min
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-dashed border-slate-200 bg-slate-50/60">
            <CardContent className="p-4 text-xs space-y-2">
              <div className="font-semibold text-slate-700 flex items-center gap-2">
                🛡️ Nuestros 4 niveles anti-doble venta
              </div>
              <ol className="space-y-1 text-slate-500 list-decimal list-inside">
                <li>Bloqueo inmediato UI al hacer clic</li>
                <li>Transacción SERVIDOR con Row Lock</li>
                <li>RPC `buy_reservations` FOR UPDATE</li>
                <li>Unique Index parcial Postgres</li>
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
