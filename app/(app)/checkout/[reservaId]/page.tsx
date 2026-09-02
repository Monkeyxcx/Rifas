import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  FileCheck2,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  Trophy,
  Zap
} from "lucide-react";
import CountdownTimer from "@/components/checkout/CountdownTimer";
import { MOCK_RIFAS } from "@/components/rifas/MOCK_RIFAS";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { Rifa } from "@/lib/types";

export const revalidate = 0;

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ reservaId: string }>;
}) {
  const { reservaId } = await params;

  const DEFAULT_RIFA_ID = "00000000-0000-0000-0000-000000000001";
  const DEFAULT_NUMBERS = ["07", "13", "23", "41", "55", "72"];

  const rifaMatch: { rifa: Rifa } =
    MOCK_RIFAS.find((r) => reservaId.includes(r.rifa.id.slice(-4))) ??
    MOCK_RIFAS.find((r) => r.rifa.id === DEFAULT_RIFA_ID) ??
    MOCK_RIFAS[0];

  const rifa = rifaMatch.rifa;
  const numbers =
    reservaId === "demo-solidaria-002"
      ? ["03", "08", "17", "29", "44", "51", "68", "89"]
      : DEFAULT_NUMBERS;

  const unitPrice = rifa.number_price;
  const subtotal = numbers.length * unitPrice;
  const platformFee = Math.round(subtotal * 0.03);
  const total = subtotal + platformFee;
  const soldPercentage = rifa.available_numbers
    ? Math.round(
        ((rifa.total_numbers - rifa.available_numbers) / rifa.total_numbers) * 100
      )
    : 57;

  const currencyMap: Record<string, string> = {
    Argentina: "ARS",
    México: "MXN",
    Chile: "CLP",
    Colombia: "COP",
    Perú: "PEN",
    Venezuela: "VES"
  };
  const country = rifa.creator?.country ?? "Colombia";
  const currency = currencyMap[country] ?? "COP";

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const endsDate = rifa.ends_at ? new Date(rifa.ends_at) : null;
  const drawDate = rifa.draw_date ? new Date(rifa.draw_date) : null;
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  };

  const prettyRifaEnds = endsDate ? endsDate.toLocaleDateString("es-ES", dateOpts) : "—";
  const prettyDrawDate = drawDate ? drawDate.toLocaleDateString("es-ES", dateOpts) : "—";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto max-w-7xl px-4 py-8 lg:py-10">
        {/* ============================================================= */}
        {/* BREADCRUMB + HEADER                                           */}
        {/* ============================================================= */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link
              href="/rifas"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-brand-rose"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a rifas
            </Link>
            <span className="opacity-40">/</span>
            <Link href={`/rifas/${rifa.id}`} className="rounded-lg px-2 py-1 hover:bg-slate-100 hover:text-slate-900">
              {rifa.title.slice(0, 36)}…
            </Link>
            <span className="opacity-40">/</span>
            <span className="rounded-lg bg-brand-rose/10 px-2 py-1 font-semibold text-brand-rose">
              Checkout · Pago seguro
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="solidarity" className="!bg-emerald-100 !text-emerald-700 !border !border-emerald-200">
                  <Ticket className="mr-1 h-3 w-3" />
                  Reserva confirmada · {numbers.length} número{numbers.length === 1 ? "" : "s"}
                </Badge>
                <Badge variant="new" className="!bg-brand-gold/15 !text-amber-700 !border !border-brand-gold/30">
                  <Sparkles className="mr-1 h-3 w-3" />
                  ID: {reservaId.slice(0, 8).toUpperCase()}…
                </Badge>
                {rifa.is_solidarity && (
                  <Badge variant="solidarity">
                    <HeartHandshake className="mr-1 h-3 w-3" />
                    Solidaria
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">
                Completa tu pago
                <span className="bg-gradient-to-r from-brand-rose via-brand-violet to-brand-cyan bg-clip-text text-transparent">
                  {" "}
                  · {rifa.prize_name}
                </span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
                Tus números están bloqueados por 15 minutos. Si completas el pago dentro
                de este plazo, son tuyos al 100%. ¡Suerte! 🍀
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* COUNTDOWN STICKY                                              */}
        {/* ============================================================= */}
        <div className="sticky top-[76px] z-40 mb-6">
          <CountdownTimer expiresAt={expiresAt} />
        </div>

        {/* ============================================================= */}
        {/* GRID 2 COLS                                                   */}
        {/* ============================================================= */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* --------------------------------------------------------- */}
          {/* COLUMNA IZQUIERDA · RESUMEN                               */}
          {/* --------------------------------------------------------- */}
          <div className="space-y-6 lg:col-span-3">
            {/* CARD 1 · INFO RIFA                               */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <div
                className={
                  rifa.is_solidarity
                    ? "relative h-44 bg-gradient-to-br from-brand-cyan via-emerald-400 to-brand-rose p-6 text-white"
                    : "relative h-44 bg-gradient-to-br from-brand-rose via-brand-violet to-brand-cyan p-6 text-white"
                }
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                    backgroundSize: "18px 18px"
                  }}
                />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <Badge
                      variant={rifa.is_solidarity ? "solidarity" : "prize"}
                      className="!bg-white !bg-opacity-95 !border-0"
                    >
                      {rifa.is_solidarity ? (
                        <>
                          <HeartHandshake className="mr-1 h-3 w-3" /> Solidaria
                        </>
                      ) : (
                        <>
                          <Trophy className="mr-1 h-3 w-3" /> Premio
                        </>
                      )}
                    </Badge>
                    <Badge variant="active" className="!bg-white/95 !text-slate-800 !border-0 shadow">
                      <Zap className="mr-1 h-3 w-3" /> {soldPercentage}% vendida
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
                      Premio a sortear
                    </p>
                    <h3 className="font-numbers text-3xl font-black tabular-nums tracking-tight drop-shadow-sm">
                      {formatCurrency(rifa.prize_value, currency)}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs font-medium opacity-95">
                      <MapPin className="h-3 w-3" />
                      {country}
                      <span className="opacity-60">·</span>
                      <CalendarDays className="h-3 w-3" />
                      {rifa.ends_at ? endsDate!.toLocaleDateString("es-CO") : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="font-display text-xl">{rifa.title}</CardTitle>
                <CardDescription>
                  Creado por <span className="font-semibold text-slate-700">{rifa.creator?.full_name ?? "Anónimo"}</span>
                  {rifa.is_solidarity && rifa.cause_name && (
                    <>
                      {" "}· Causa solidaria:{" "}
                      <span className="font-semibold text-emerald-600">
                        {rifa.cause_name}
                      </span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Progreso de ventas</span>
                    <span className="font-numbers tabular-nums text-slate-900">
                      {rifa.total_numbers - rifa.available_numbers} / {rifa.total_numbers}
                    </span>
                  </div>
                  <Progress value={soldPercentage} className="h-2">
                  </Progress>
                </div>

                <Separator />

                {/* NÚMEROS SELECCIONADOS                      */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Ticket className="h-4 w-4 text-brand-rose" />
                      Tus números de la suerte
                    </h4>
                    <Badge variant="secondary" className="font-numbers tabular-nums">
                      {numbers.length} reservados
                    </Badge>
                  </div>

                  <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
                    {numbers.map((n) => (
                      <div
                        key={n}
                        className="group relative aspect-square rounded-xl border-2 border-brand-rose/60 bg-gradient-to-br from-brand-rose via-brand-violet to-brand-violet text-center shadow-cta shadow-brand-rose/20 transition active:scale-95"
                      >
                        <span className="absolute inset-0 grid place-items-center font-numbers text-xl font-black text-white tabular-nums drop-shadow">
                          {n}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* DESGLose PRECIO                              */}
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <FileCheck2 className="h-4 w-4 text-brand-cyan" />
                    Desglose de tu compra
                  </h4>
                  <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>
                        Precio por número · <span className="font-semibold text-slate-700">{numbers.length}</span>
                      </span>
                      <span className="font-numbers tabular-nums">
                        {formatCurrency(unitPrice, currency)} × {numbers.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Subtotal números</span>
                      <span className="font-numbers font-medium tabular-nums text-slate-800">
                        {formatCurrency(subtotal, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand-violet" />
                        Comisión plataforma (3%) · seguro y soporte 24/7
                      </span>
                      <span className="font-numbers font-medium tabular-nums text-slate-800">
                        {formatCurrency(platformFee, currency)}
                      </span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between pt-1 text-base font-black text-slate-900">
                      <span>TOTAL A PAGAR</span>
                      <span className="font-numbers text-xl tabular-nums tracking-tight text-brand-rose">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FECHAS IMPORTANTES                           */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-brand-rose/20 bg-gradient-to-br from-brand-rose/5 via-white to-brand-rose/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-rose">
                      <Clock3 className="h-3.5 w-3.5" /> Cierre rifa
                    </div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{prettyRifaEnds}</p>
                  </div>
                  <div className="rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 via-white to-brand-gold/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                      <Trophy className="h-3.5 w-3.5" /> Día del sorteo
                    </div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{prettyDrawDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2 · BENEFICIOS / PASOS                */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Sparkles className="h-5 w-5 text-brand-gold" />
                  ¿Qué pasa después de pagar?
                </CardTitle>
                <CardDescription>4 pasos claros. Sin letras pequeñas.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    {
                      n: "1",
                      t: "Confirmación instantánea",
                      d: "Aprobado el pago, tu reserva pasa a estado PAGADO y los números son tuyos.",
                      c: "from-brand-rose to-brand-violet"
                    },
                    {
                      n: "2",
                      t: "Ticket en mis rifas",
                      d: "Recibirás notificación push y email con tu comprobante oficial descargable.",
                      c: "from-brand-cyan to-sky-500"
                    },
                    {
                      n: "3",
                      t: "Sorteo transparente",
                      d: "Transmisión en vivo con testigos, hash público y método de sorteo documentado.",
                      c: "from-brand-gold to-amber-500"
                    },
                    {
                      n: "4",
                      t: "Entrega del premio",
                      d: "Si ganas, el creador coordina envío o entrega. Garantía RifasCenter 30 días.",
                      c: "from-emerald-500 to-brand-cyan"
                    }
                  ].map((s) => (
                    <li key={s.n} className="relative rounded-2xl border border-slate-200 bg-white p-4">
                      <div
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${s.c} font-numbers text-sm font-black text-white shadow-sm`}
                      >
                        {s.n}
                      </div>
                      <p className="mt-3 text-sm font-bold text-slate-900">{s.t}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">{s.d}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* --------------------------------------------------------- */}
          {/* COLUMNA DERECHA · PAGO sticky                             */}
          {/* --------------------------------------------------------- */}
          <div className="lg:col-span-2">
            <div className="sticky top-[156px] space-y-5">
              {/* CARD PAGO SEGURO                               */}
              <Card className="overflow-hidden border-slate-200 shadow-lg">
                <div className="relative bg-gradient-to-br from-brand-gold via-rose-500 to-brand-violet p-5 text-white">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.8) 0, transparent 40%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.6) 0, transparent 40%)"
                    }}
                  />
                  <div className="relative flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/40">
                      <ShieldCheck className="h-6 w-6" strokeWidth={2.3} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-widest opacity-90">
                        Pago 100% seguro · Mercado Pago
                      </p>
                      <h3 className="font-display text-xl font-black leading-tight">
                        Completa con los datos de pago
                      </h3>
                    </div>
                  </div>
                </div>

                <CardContent className="space-y-5 pt-6">
                  {/* USUARIO                             */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-brand-violet" />
                      Datos del comprador
                    </h4>
                    <div className="grid gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue="comprador@demo.rifascenter.com"
                          className="h-11"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="name">Nombre</Label>
                          <Input id="name" defaultValue="Comprador Demo" className="h-11" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="flex items-center gap-1.5">
                            <Smartphone className="h-3 w-3" />
                            Teléfono
                          </Label>
                          <Input id="phone" defaultValue="+57 300 123 4567" className="h-11" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* MEDIOS PAGO                          */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">Medios de pago aceptados</h4>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        "VISA",
                        "MC",
                        "AMEX",
                        "Cabal",
                        "Diners",
                        "QR",
                        "Pix",
                        "PagoEfectivo",
                        "RapiPago",
                        "PIM",
                        "SPEI",
                        "Bancos"
                      ].map((m) => (
                        <div
                          key={m}
                          className="grid aspect-[5/3] place-items-center rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-1.5 text-center text-[10px] font-black uppercase tracking-tight text-slate-500 transition hover:border-brand-rose/40 hover:from-rose-50 hover:text-brand-rose"
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* RESUMEN TOTAL                       */}
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>{numbers.length} × {formatCurrency(unitPrice, currency)}</span>
                        <span className="font-numbers tabular-nums">{formatCurrency(subtotal, currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Comisión plataforma</span>
                        <span className="font-numbers tabular-nums">{formatCurrency(platformFee, currency)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Total
                        </span>
                        <span className="font-numbers text-2xl font-black tabular-nums tracking-tight text-brand-rose">
                          {formatCurrency(total, currency)}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-end text-[11px] font-semibold text-slate-400">
                        Moneda: {currency} · Impuestos incluidos
                      </div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="group relative h-14 w-full !bg-gradient-to-r from-brand-gold via-rose-500 to-brand-violet text-base font-black text-white shadow-cta shadow-rose-500/30 transition active:scale-[0.98]"
                  >
                    <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
                    <span className="relative flex items-center justify-center gap-2.5">
                      <CreditCard className="h-5 w-5" strokeWidth={2.3} />
                      💳 Pagar con Mercado Pago ·{" "}
                      <span className="font-numbers tabular-nums">
                        {formatCurrency(total, currency)}
                      </span>
                    </span>
                  </Button>

                  {/* AMBIENTE DEMO badge                   */}
                  <div className="rounded-xl border border-dashed border-brand-gold/60 bg-amber-50/70 px-3.5 py-2.5 text-center text-[11px] font-bold text-amber-700">
                    🧪 MODO DEMO · Entorno Sandbox · Sin cargos reales · Prueba flujo completo
                  </div>
                </CardContent>

                <CardFooter className="grid gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 text-[11px] font-semibold text-slate-500">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> SSL · 256 bits
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-500" /> Reembolso 48h
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-brand-rose" /> Reserva 15 min
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-brand-gold" /> Soporte 24/7
                    </div>
                  </div>
                </CardFooter>
              </Card>

              {/* CARD ANTI DOBLE VENTA (recuerda)          */}
              <Card className="border-dashed border-2 border-brand-cyan/40 bg-cyan-50/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-display text-base text-cyan-900">
                    <ShieldCheck className="h-4 w-4 text-brand-cyan" />
                    Tus números están protegidos contra doble venta
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="space-y-1.5 text-xs font-semibold text-cyan-900/80">
                    <li>1. Bloqueo inmediato en UI al confirmar pago</li>
                    <li>2. Transacción servidor con Row-Level Lock</li>
                    <li>3. RPC <code className="rounded bg-white/60 px-1">buy_reservations</code> FOR UPDATE</li>
                    <li>4. <span className="font-black">Unique Index parcial</span> Postgres — imbatible</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
