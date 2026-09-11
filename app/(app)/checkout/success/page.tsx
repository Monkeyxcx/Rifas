import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Gift,
  Home,
  PartyPopper,
  Ticket,
  Trophy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type { Rifa, RifaStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import SuccessRedirectCountdown from "@/components/checkout/SuccessRedirectCountdown";

export const metadata = {
  title: "Pago aprobado · RifasCenter",
  description: "Tu pago fue confirmado. Revisa tu ticket oficial en Mis Rifas."
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

const RIFA_JOIN_SELECT = `
  id, creator_id, title, slug, description, prize_name, prize_image_url,
  prize_value, is_solidarity, cause_name, cause_description, cause_target,
  number_price, total_numbers, available_numbers, status, ends_at, draw_date,
  created_at, updated_at,
  creator:profiles!rifas_creator_id_fkey(id, full_name, avatar_url, country)
`;

type RifaJoinedRow = {
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

const UUID_RE = /^[0-9a-fA-F-]{36}$/;
const NUM_RE = /^\d{2}$/;

function mapRifaRow(r: RifaJoinedRow): Rifa {
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
    status: r.status,
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

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: Promise<{
    preference_id?: string;
    payment_id?: string;
    external_reference?: string;
    rifa_id?: string;
    numbers?: string;
  }>;
}) {
  const sp = await searchParams;
  const preferenceId = sp.preference_id ?? "—";
  const paymentId = sp.payment_id ?? "—";
  const externalReference = sp.external_reference ?? "—";
  const rifaId = sp.rifa_id;
  const numbersQuery = sp.numbers;

  let rifa: Rifa | null = null;
  let numbersArr: string[] = [];
  let currency = "COP";
  let total = 0;

  if (rifaId && UUID_RE.test(rifaId)) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("rifas")
        .select(RIFA_JOIN_SELECT)
        .eq("id", rifaId)
        .single();
      if (data) {
        const row = data as unknown as RifaJoinedRow;
        rifa = mapRifaRow(row);
        const country = rifa.creator?.country ?? "Colombia";
        const currencyMap: Record<string, string> = {
          Argentina: "ARS",
          México: "MXN",
          Chile: "CLP",
          Colombia: "COP",
          Perú: "PEN",
          Venezuela: "VES"
        };
        currency = currencyMap[country] ?? "COP";
        numbersArr = (numbersQuery ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .filter((n) => NUM_RE.test(n));
        const subtotal = numbersArr.length * rifa.number_price;
        total = subtotal + Math.round(subtotal * 0.03);
      }
    } catch (e) {
      console.error("[success] rifa lookup failed", e);
    }
  }

  const paymentShort =
    paymentId && paymentId !== "—" ? paymentId.toString().slice(-8) : "—";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/40 to-slate-50">
      <div className="container mx-auto max-w-5xl px-2 sm:px-4 py-4 sm:py-6 lg:py-12">
        <SuccessRedirectCountdown target="/mis-rifas/participando" seconds={8} />
        <div className="mb-3 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-500">
          <Link
            href="/rifas"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-brand-rose shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Rifas
          </Link>
          <span className="opacity-40 shrink-0">/</span>
          <span className="rounded-lg bg-emerald-100 px-2 py-1 font-semibold text-emerald-700 shrink-0">
            Pago aprobado
          </span>
        </div>

        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-brand-cyan p-5 sm:p-8 lg:p-10 text-white shadow-2xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
              backgroundSize: "18px 18px"
            }}
          />
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-3.5 sm:mb-5 grid h-14 w-14 sm:h-20 sm:w-20 place-items-center rounded-full bg-white/20 backdrop-blur ring-4 ring-white/30">
              <CheckCircle2 className="h-8 w-8 sm:h-12 sm:w-12" strokeWidth={2.4} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Badge className="!bg-white !text-emerald-700 !border-0 shadow !text-[10px] sm:!text-xs py-0">
                <PartyPopper className="mr-1 h-3 w-3" />
                ¡Pago confirmado!
              </Badge>
              {rifa?.is_solidarity && (
                <Badge variant="solidarity" className="!bg-white/95 !text-emerald-800 !border-0 !text-[10px] sm:!text-xs py-0">
                  <Gift className="mr-1 h-3 w-3" /> Solidaria
                </Badge>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight lg:text-4xl leading-tight">
              🎉 ¡Felicidades! Tu participación está confirmada
            </h1>
            <p className="mt-1.5 sm:mt-2 max-w-2xl text-xs sm:text-sm text-white/90 lg:text-base leading-relaxed">
              Los números ya son oficialmente tuyos. Recibiste una notificación push
              y el comprobante por email. ¡Mucha suerte en el sorteo! 🍀
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-5 lg:grid-cols-3">
          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2.5 sm:pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-base sm:text-xl">
                <FileCheck2 className="h-4 w-4 sm:h-5 sm:w-5 text-brand-rose shrink-0" />
                Detalles de tu compra
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs leading-relaxed">
                Comprobante oficial · guarda esta página o revisa Mis Rifas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6 text-xs sm:text-sm">
              {rifa && (
                <div className="rounded-xl sm:rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 sm:p-4">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-brand-cyan text-white shadow-cta">
                      {rifa.is_solidarity ? (
                        <Gift className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      ) : (
                        <Trophy className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Rifa
                      </p>
                      <h3 className="font-display text-sm sm:text-base font-black text-slate-900 leading-snug line-clamp-2">
                        {rifa.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-slate-600 leading-snug">
                        Premio:{" "}
                        <span className="font-black text-emerald-700">
                          {formatCurrency(rifa.prize_value, currency)}
                        </span>{" "}
                        <span className="hidden sm:inline">· {rifa.prize_name}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {numbersArr.length > 0 && (
                <div>
                  <div className="mb-1.5 sm:mb-2 flex items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Ticket className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-brand-rose shrink-0" />
                      <span className="truncate">Tus números oficiales</span>
                    </span>
                    <Badge variant="paid" className="!bg-emerald-100 !text-emerald-700 !border !border-emerald-200 !text-[10px] sm:!text-xs py-0 shrink-0">
                      PAGADOS · {numbersArr.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-1.5 sm:gap-2">
                    {numbersArr.map((n) => (
                      <div
                        key={n}
                        className="aspect-square rounded-md sm:rounded-lg border-2 border-emerald-400 bg-gradient-to-br from-emerald-500 via-brand-cyan to-brand-rose text-center shadow-md shadow-emerald-500/20"
                      >
                        <div className="grid h-full w-full place-items-center font-numbers text-sm sm:text-base font-black text-white tabular-nums drop-shadow">
                          {n}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                <div className="flex items-start justify-between text-slate-600 text-[11px] sm:text-xs gap-2">
                  <span className="shrink-0">MP Payment</span>
                  <span className="font-mono font-bold text-slate-800 text-right">
                    {paymentShort}
                  </span>
                </div>
                <div className="flex items-start justify-between text-slate-600 text-[11px] sm:text-xs gap-2">
                  <span className="shrink-0">Preference</span>
                  <span className="font-mono font-bold text-slate-800 text-right break-all">
                    {preferenceId}
                  </span>
                </div>
                <div className="flex items-start justify-between text-slate-600 text-[11px] sm:text-xs gap-2">
                  <span className="shrink-0">External Ref</span>
                  <span className="font-mono font-bold text-slate-800 text-right break-all">
                    {externalReference}
                  </span>
                </div>
                {total > 0 && (
                  <>
                    <Separator className="my-0.5 sm:my-1" />
                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500">
                        Total pagado
                      </span>
                      <span className="font-numbers text-lg sm:text-xl font-black tabular-nums text-emerald-700">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 sm:space-y-5">
            <Card className="border-slate-200 shadow-sm hidden sm:block">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2.5 sm:pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-base sm:text-lg">
                  <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-brand-violet shrink-0" />
                  Siguientes pasos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <ol className="space-y-2.5 sm:space-y-3 text-[11px] sm:text-xs font-semibold text-slate-600">
                  <li className="flex gap-2">
                    <Badge className="!h-6 !w-6 shrink-0 !bg-gradient-to-br from-emerald-500 to-brand-cyan !text-white !border-0 font-numbers !pt-0 !pb-0">
                      1
                    </Badge>
                    <span>Revisa tu email. Llegó tu <b>ticket oficial</b> y recibo.</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge className="!h-6 !w-6 shrink-0 !bg-gradient-to-br from-brand-violet to-brand-rose !text-white !border-0 font-numbers !pt-0 !pb-0">
                      2
                    </Badge>
                    <span>Guarda tus números. Están guardados en Mis Rifas siempre.</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge className="!h-6 !w-6 shrink-0 !bg-gradient-to-br from-brand-gold to-amber-500 !text-white !border-0 font-numbers !pt-0 !pb-0">
                      3
                    </Badge>
                    <span>Atiende el <b>sorteo</b> y ¡suerte! Si ganas te contactamos.</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <div className="space-y-2.5 sm:space-y-3">
              <Button
                asChild
                size="lg"
                className="w-full h-10 sm:h-12 !bg-gradient-to-r from-emerald-500 to-brand-cyan !text-white font-black shadow-cta shadow-emerald-500/30 text-xs sm:text-sm"
              >
                <Link href="/mis-rifas/participando">
                  <FileCheck2 className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                  Ver mis tickets
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full h-10 sm:h-12 !border-slate-300 !text-slate-700 font-bold text-xs sm:text-sm"
              >
                <Link href="/rifas">
                  <Home className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                  Explorar más rifas
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
