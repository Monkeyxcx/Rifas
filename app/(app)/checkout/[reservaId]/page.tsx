import CheckoutPaymentButton from "@/components/checkout/CheckoutPaymentButton";
import CountdownTimer from "@/components/checkout/CountdownTimer";
import MPPaymentWatcherOverlay from "@/components/checkout/MPPaymentWatcherOverlay";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type { Rifa, RifaStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
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
import Link from "next/link";
import { redirect } from "next/navigation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const RIFA_CHECKOUT_SELECT = `
  id, creator_id, title, slug, description, prize_name, prize_image_url,
  prize_value, is_solidarity, cause_name, cause_description, cause_target,
  number_price, total_numbers, available_numbers, status, ends_at, draw_date,
  created_at, updated_at,
  creator:profiles!rifas_creator_id_fkey(id, full_name, avatar_url, country)
`;

const PROFILE_SELECT = `id, full_name, avatar_url, country, phone, wallet_balance, created_at`;

type RifaCheckoutJoined = {
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
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    country: string | null;
  } | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  phone: string | null;
  wallet_balance: number;
  created_at: string;
};

const UUID_RE = /^[0-9a-fA-F-]{36}$/;
const NUM_RE = /^\d{2}$/;

const currencyMap: Record<string, string> = {
  Argentina: "ARS",
  México: "MXN",
  Chile: "CLP",
  Colombia: "COP",
  Perú: "PEN",
  Venezuela: "VES"
};

function mapRifaRow(r: RifaCheckoutJoined): Rifa {
  return {
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
    draw_instructions: null,
    banner_ad_config: null,
    metadata: null,
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
  };
}

export default async function CheckoutPage({
  params,
  searchParams
}: {
  params: Promise<{ reservaId: string }>;
  searchParams: Promise<{ rifa_id?: string; numbers?: string }>;
}) {
  const { reservaId } = await params;
  const { rifa_id, numbers } = await searchParams;

  if (!UUID_RE.test(reservaId)) {
    redirect("/mis-rifas/participando?error=reserva_invalida");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: uErr
  } = await supabase.auth.getUser();
  if (uErr || !user) {
    const qs = new URLSearchParams();
    if (rifa_id) qs.set("rifa_id", rifa_id);
    if (numbers) qs.set("numbers", numbers);
    const qsStr = qs.toString();
    const redirectTo = `/checkout/${reservaId}${qsStr ? `?${qsStr}` : ""}`;
    redirect(`/auth?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (!rifa_id || !UUID_RE.test(rifa_id)) {
    redirect("/mis-rifas/participando?error=rifa_invalida");
  }
  const numbersArr = (numbers ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((n) => NUM_RE.test(n));
  if (!numbersArr.length) {
    redirect("/mis-rifas/participando?error=sin_numeros");
  }

  const { data: rifaRow, error: rifaErr } = await supabase
    .from("rifas")
    .select(RIFA_CHECKOUT_SELECT)
    .eq("id", rifa_id)
    .single();

  if (rifaErr || !rifaRow) {
    console.error("[checkout] rifa lookup failed", rifaErr);
    redirect("/mis-rifas/participando?error=rifa_no_existe");
  }
  const joined = rifaRow as unknown as RifaCheckoutJoined;
  const rifa = mapRifaRow(joined);

  const { data: reservasRows, error: reservasErr } = await supabase
    .from("reservas")
    .select("id, rifa_id, user_id, number, status, expires_at, reserved_session_key, created_at, updated_at")
    .eq("rifa_id", rifa_id)
    .in("number", numbersArr)
    .in("status", ["reserved", "paid"])
    .order("created_at", { ascending: false });

  if (reservasErr) {
    console.error("[checkout] reservas lookup failed", reservasErr);
    redirect("/mis-rifas/participando?error=reserva_error");
  }

  const reservas = (reservasRows ?? []) as Array<{
    id: string;
    rifa_id: string;
    user_id: string;
    number: string;
    status: string;
    expires_at: string;
    created_at: string;
  }>;

  const foundByNumber = new Map(reservas.map((r) => [r.number, r]));
  for (const n of numbersArr) {
    const r = foundByNumber.get(n);
    if (!r) {
      redirect(`/mis-rifas/participando?error=numero_no_reservado&n=${n}`);
    }
    if (r.user_id !== user.id) {
      redirect(`/mis-rifas/participando?error=numero_no_es_tuyo&n=${n}`);
    }
    if (r.status !== "reserved") {
      redirect(`/mis-rifas/participando?error=numero_ya_pagado&n=${n}`);
    }
  }

  const minExpireIso = reservas.reduce(
    (acc, r) => (!acc || r.expires_at < acc ? r.expires_at : acc),
    null as string | null
  );

  const { data: profileRow } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow as unknown as ProfileRow | null;

  const payerEmail = user.email ?? "";
  const payerName = profile?.full_name ?? user.user_metadata?.full_name ?? "";
  const payerPhone = profile?.phone ?? user.user_metadata?.phone ?? "";

  const unitPrice = rifa.number_price;
  const subtotal = numbersArr.length * unitPrice;
  const platformFee = Math.round(subtotal * 0.03);
  const total = subtotal + platformFee;
  const soldPercentage = rifa.available_numbers
    ? Math.round(
        ((rifa.total_numbers - rifa.available_numbers) / rifa.total_numbers) * 100
      )
    : 57;

  const country = rifa.creator?.country ?? "Colombia";
  const currency = currencyMap[country] ?? "COP";

  const expiresAt = minExpireIso ?? new Date(Date.now() + 15 * 60 * 1000).toISOString();
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

  const isDemo = process.env.NODE_ENV !== "production";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 py-4 sm:py-6 lg:py-10">
        {/* HEADER */}
        <div className="mb-5 sm:mb-8">
          <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-500">
            <Link
              href="/rifas"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-brand-rose shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a rifas
            </Link>
            <span className="opacity-40 shrink-0">/</span>
            <Link href={`/rifas/${rifa.id}`} className="rounded-lg px-2 py-1 hover:bg-slate-100 hover:text-slate-900 min-w-0 truncate max-w-[40%]">
              {rifa.title.length > 28 ? rifa.title.slice(0, 28) + "…" : rifa.title}
            </Link>
            <span className="opacity-40 shrink-0">/</span>
            <span className="rounded-lg bg-brand-rose/10 px-2 py-1 font-semibold text-brand-rose shrink-0">
              Checkout
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge variant="solidarity" className="!bg-emerald-100 !text-emerald-700 !border !border-emerald-200 !text-[10px] sm:!text-xs">
                  <Ticket className="mr-1 h-3 w-3" />
                  Reserva · {numbersArr.length} Nº
                </Badge>
                <Badge variant="new" className="!bg-brand-gold/15 !text-amber-700 !border !border-brand-gold/30 !text-[10px] sm:!text-xs">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {reservaId.slice(0, 8).toUpperCase()}
                </Badge>
                {rifa.is_solidarity && (
                  <Badge variant="solidarity" className="!text-[10px] sm:!text-xs">
                    <HeartHandshake className="mr-1 h-3 w-3" />
                    Solidaria
                  </Badge>
                )}
              </div>
              <h1 className="mt-2.5 sm:mt-3 font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900 lg:text-4xl leading-tight">
                Completa tu pago
                <span className="block sm:inline bg-gradient-to-r from-brand-rose via-brand-violet to-brand-cyan bg-clip-text text-transparent">
                  {" "}· {rifa.prize_name}
                </span>
              </h1>
              <p className="mt-1 sm:mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed">
                Tus números están bloqueados 15 min. Paga antes de que termine el plazo y son tuyos al 100%. ¡Suerte! 🍀
              </p>
            </div>
          </div>
        </div>

        {/* COUNTDOWN STICKY */}
        <div className="sticky top-[72px] z-40 mb-4 sm:mb-6">
          <CountdownTimer expiresAt={expiresAt} />
        </div>

        {/* GRID 2 COLS */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* COLUMNA IZQUIERDA · RESUMEN */}
          <div className="space-y-6 lg:col-span-3">
            {/* CARD 1 · INFO RIFA */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <div
                className={
                  rifa.is_solidarity
                    ? "relative h-32 sm:h-40 md:h-44 bg-gradient-to-br from-brand-cyan via-emerald-400 to-brand-rose p-4 sm:p-5 md:p-6 text-white"
                    : "relative h-32 sm:h-40 md:h-44 bg-gradient-to-br from-brand-rose via-brand-violet to-brand-cyan p-4 sm:p-5 md:p-6 text-white"
                }
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                    backgroundSize: "16px 16px"
                  }}
                />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant={rifa.is_solidarity ? "solidarity" : "prize"}
                      className="!bg-white !bg-opacity-95 !border-0 !text-[10px] sm:!text-xs py-0"
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
                    <Badge variant="active" className="!bg-white/95 !text-slate-800 !border-0 shadow !text-[10px] sm:!text-xs py-0 shrink-0">
                      <Zap className="mr-1 h-3 w-3" /> {soldPercentage}%
                    </Badge>
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-90">
                      Premio
                    </p>
                    <h3 className="font-numbers text-2xl sm:text-3xl font-black tabular-nums tracking-tight drop-shadow-sm">
                      {formatCurrency(rifa.prize_value, currency)}
                    </h3>
                    <div className="mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium opacity-95">
                      <MapPin className="h-3 w-3" />
                      {country}
                      <span className="opacity-60 hidden sm:inline">·</span>
                      <CalendarDays className="h-3 w-3 hidden sm:inline" />
                      <span className="hidden sm:inline">{rifa.ends_at ? endsDate?.toLocaleDateString("es-CO") : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                <CardTitle className="font-display text-lg sm:text-xl leading-snug">{rifa.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">
                  Creado por <span className="font-semibold text-slate-700">{rifa.creator?.full_name ?? "Anónimo"}</span>
                  {rifa.is_solidarity && rifa.cause_name && (
                    <>
                      {" "}· Causa:{" "}
                      <span className="font-semibold text-emerald-600">
                        {rifa.cause_name}
                      </span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-4 sm:pb-6">
                <div>
                  <div className="mb-1.5 sm:mb-2 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-600">
                    <span>Ventas</span>
                    <span className="font-numbers tabular-nums text-slate-900">
                      {rifa.total_numbers - rifa.available_numbers}/{rifa.total_numbers}
                    </span>
                  </div>
                  <Progress value={soldPercentage} className="h-1.5 sm:h-2" />
                </div>

                <Separator />

                {/* NÚMEROS SELECCIONADOS */}
                <div>
                  <div className="mb-2.5 sm:mb-3 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 min-w-0">
                      <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-rose shrink-0" />
                      <span className="truncate">Tus números</span>
                    </h4>
                    <Badge variant="secondary" className="font-numbers tabular-nums !text-[10px] sm:!text-xs py-0 shrink-0">
                      {numbersArr.length} Nº
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-1.5 sm:gap-2.5">
                    {numbersArr.map((n) => (
                      <div
                        key={n}
                        className="group relative aspect-square rounded-lg sm:rounded-xl border-2 border-brand-rose/60 bg-gradient-to-br from-brand-rose via-brand-violet to-brand-violet text-center shadow-cta shadow-brand-rose/20 transition active:scale-95"
                      >
                        <span className="absolute inset-0 grid place-items-center font-numbers text-lg sm:text-xl font-black text-white tabular-nums drop-shadow">
                          {n}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* FECHAS IMPORTANTES */}
                <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
                  <div className="rounded-xl sm:rounded-2xl border border-brand-rose/20 bg-gradient-to-br from-brand-rose/5 via-white to-brand-rose/5 p-3 sm:p-4">
                    <div className="mb-1.5 sm:mb-2 flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-brand-rose">
                      <Clock3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Cierre rifa
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2">{prettyRifaEnds}</p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 via-white to-brand-gold/5 p-3 sm:p-4">
                    <div className="mb-1.5 sm:mb-2 flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-amber-700">
                      <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Sorteo
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2">{prettyDrawDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2 · BENEFICIOS / PASOS */}
            <Card className="border-slate-200 shadow-sm hidden sm:block">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2.5 sm:pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-brand-gold" />
                  ¿Qué pasa después de pagar?
                </CardTitle>
                <CardDescription className="text-[11px] sm:text-xs">4 pasos claros. Sin letras pequeñas.</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <ol className="grid gap-2 sm:gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    {
                      n: "1",
                      t: "Confirmación",
                      d: "Aprobado el pago, tu reserva pasa a PAGADO y los números son tuyos.",
                      c: "from-brand-rose to-brand-violet"
                    },
                    {
                      n: "2",
                      t: "Ticket oficial",
                      d: "Recibirás notificación push y email con tu comprobante descargable.",
                      c: "from-brand-cyan to-sky-500"
                    },
                    {
                      n: "3",
                      t: "Sorteo",
                      d: "Transmisión en vivo con testigos, hash público y método documentado.",
                      c: "from-brand-gold to-amber-500"
                    },
                    {
                      n: "4",
                      t: "Premio",
                      d: "Si ganas, el creador coordina entrega. Garantía RifasCenter 30 días.",
                      c: "from-emerald-500 to-brand-cyan"
                    }
                  ].map((s) => (
                    <li key={s.n} className="relative rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                      <div
                        className={`inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br ${s.c} font-numbers text-xs sm:text-sm font-black text-white shadow-sm`}
                      >
                        {s.n}
                      </div>
                      <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-bold text-slate-900">{s.t}</p>
                      <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed">{s.d}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* COLUMNA DERECHA · PAGO sticky */}
          <div className="lg:col-span-2">
            <div className="sticky top-[148px] sm:top-[152px] space-y-4 sm:space-y-5">
              {/* CARD PAGO SEGURO */}
              <Card className="overflow-hidden border-slate-200 shadow-lg">
                <div className="relative bg-gradient-to-br from-brand-gold via-rose-500 to-brand-violet p-3.5 sm:p-5 text-white">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.8) 0, transparent 40%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.6) 0, transparent 40%)"
                    }}
                  />
                  <div className="relative flex items-center gap-2.5 sm:gap-3">
                    <div className="grid h-10 w-10 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/40">
                      <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.3} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest opacity-90">
                        Pago seguro · Mercado Pago
                      </p>
                      <h3 className="font-display text-base sm:text-xl font-black leading-tight">
                        Completa tu pago
                      </h3>
                    </div>
                  </div>
                </div>

                <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6">
                  {/* USUARIO (solo lectura con datos reales de perfil) */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-violet shrink-0" />
                      Comprador
                    </h4>
                    <div className="space-y-2 rounded-xl sm:rounded-2xl bg-slate-50 p-2.5 sm:p-3.5 text-[11px] sm:text-xs text-slate-600">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-500 w-20 sm:w-24 shrink-0">Correo</span>
                        <span className="font-semibold text-slate-800 text-right break-all">{payerEmail || "—"}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-500 w-20 sm:w-24 shrink-0">Nombre</span>
                        <span className="font-semibold text-slate-800 text-right">{payerName || "Comprador"}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-500 w-20 sm:w-24 shrink-0 flex items-center gap-1">
                          <Smartphone className="h-3 w-3" /> Tel
                        </span>
                        <span className="font-semibold text-slate-800 text-right">{payerPhone || "Sin registrar"}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* MEDIOS PAGO */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Medios de pago</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
                      {[
                        "VISA",
                        "MC",
                        "AMEX",
                        "QR",
                        "Pix",
                        "SPEI",
                        "Cabal",
                        "Diners",
                        "RapiPago",
                        "PIM",
                        "Bancos",
                        "Efectivo"
                      ].map((m) => (
                        <div
                          key={m}
                          className="grid aspect-[5/3] place-items-center rounded-md sm:rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-1 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-slate-500 transition hover:border-brand-rose/40 hover:from-rose-50 hover:text-brand-rose"
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* RESUMEN TOTAL */}
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 sm:p-4">
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>{numbersArr.length} × {formatCurrency(unitPrice, currency)}</span>
                        <span className="font-numbers tabular-nums">{formatCurrency(subtotal, currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Plataforma (3%)</span>
                        <span className="font-numbers tabular-nums">{formatCurrency(platformFee, currency)}</span>
                      </div>
                      <Separator className="my-1.5 sm:my-2" />
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                          Total
                        </span>
                        <span className="font-numbers text-xl sm:text-2xl font-black tabular-nums tracking-tight text-brand-rose">
                          {formatCurrency(total, currency)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex justify-end text-[10px] sm:text-[11px] font-semibold text-slate-400">
                        {currency} · Impuestos incluidos
                      </div>
                    </div>
                  </div>

                  <CheckoutPaymentButton
                    reservaId={reservaId}
                    rifaId={rifa.id}
                    numbers={numbersArr}
                    total={total}
                    currency={currency}
                    payerEmail={payerEmail}
                    payerName={payerName}
                    payerPhone={payerPhone}
                  />

                  <MPPaymentWatcherOverlay
                    reservaId={reservaId}
                    rifaId={rifa.id}
                    initialStatus={(reservas[0]?.status as "reserved") ?? "reserved"}
                    numbers={numbersArr}
                    unitPrice={unitPrice}
                    totalAmount={total}
                    currency={currency}
                  />

                  {isDemo && (
                    <div className="rounded-lg sm:rounded-xl border border-dashed border-brand-gold/60 bg-amber-50/70 px-3 py-2 text-center text-[10px] sm:text-[11px] font-bold text-amber-700 leading-snug">
                      🧪 MODO DEMO · Sandbox · Sin cargos reales
                    </div>
                  )}
                </CardContent>

                <CardFooter className="grid gap-2 border-t border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-[11px] font-semibold text-slate-500">
                  <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-1 sm:gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 shrink-0" /> SSL
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500 shrink-0" /> Reembolso 48h
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ticket className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-brand-rose shrink-0" /> Reserva 15 min
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-brand-gold shrink-0" /> Soporte 24/7
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
