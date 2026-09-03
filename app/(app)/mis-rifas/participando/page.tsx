import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { PagoStatus, ReservaStatus, Rifa, RifaStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  Gift,
  PartyPopper,
  Ticket,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const revalidate = 0;

const RIFA_PARTICIPACION_SELECT = `
  id, creator_id, title, slug, description, prize_name, prize_image_url,
  prize_value, is_solidarity, cause_name, cause_description, cause_target,
  number_price, total_numbers, available_numbers, status, ends_at, draw_date,
  created_at, updated_at,
  creator:profiles!rifas_creator_id_fkey(id, full_name, avatar_url, country)
`;

const RESERVAS_JOIN_SELECT = `
  id, rifa_id, user_id, number, status, expires_at, reserved_session_key,
  created_at, updated_at,
  rifa:rifas!inner(${RIFA_PARTICIPACION_SELECT})
`;

type RifaParticipacionJoined = {
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

type ReservaRow = {
  id: string;
  rifa_id: string;
  user_id: string;
  number: string;
  status: ReservaStatus;
  expires_at: string;
  reserved_session_key: string | null;
  created_at: string;
  updated_at: string;
  rifa: RifaParticipacionJoined;
};

type Participacion = {
  id: string;
  rifa: Rifa;
  numbers: string[];
  pagoStatus: PagoStatus;
  pagoDate: string;
  monto: number;
  ticket: string;
};

function mapRifaRow(r: RifaParticipacionJoined): Rifa {
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

function mapReservaToPagoStatus(res: ReservaStatus): PagoStatus {
  switch (res) {
    case "paid":
      return "approved";
    case "reserved":
      return "in_process";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "expired":
      return "rejected";
    default:
      return "pending";
  }
}

async function loadParticipaciones(): Promise<Participacion[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: uErr
  } = await supabase.auth.getUser();
  if (uErr || !user) redirect("/auth");

  const { data, error } = await supabase
    .from("reservas")
    .select(RESERVAS_JOIN_SELECT)
    .eq("user_id", user.id)
    .in("status", ["reserved", "paid", "cancelled", "refunded", "expired"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[mis-rifas/participando] DB error", error);
    return [];
  }
  const rows = (data ?? []) as unknown as ReservaRow[];

  const grouped = new Map<string, Participacion>();
  for (const row of rows) {
    const rifaId = row.rifa_id;
    const existing = grouped.get(rifaId);
    const statusNow = mapReservaToPagoStatus(row.status);
    const priority: Record<PagoStatus, number> = {
      approved: 5,
      in_process: 4,
      pending: 3,
      refunded: 2,
      cancelled: 1,
      rejected: 0
    };
    if (!existing) {
      grouped.set(rifaId, {
        id: `PART-${row.id.slice(0, 8).toUpperCase()}`,
        rifa: mapRifaRow(row.rifa),
        numbers: [row.number],
        pagoStatus: statusNow,
        pagoDate: row.created_at,
        monto: row.rifa.number_price,
        ticket: `TCK-RIF-${rifaId.slice(0, 6).toUpperCase()}-${new Date(row.created_at).getFullYear()}`
      });
    } else {
      existing.numbers.push(row.number);
      existing.monto += row.rifa.number_price;
      if (priority[statusNow] > priority[existing.pagoStatus]) {
        existing.pagoStatus = statusNow;
      }
      if (new Date(row.created_at) > new Date(existing.pagoDate)) {
        existing.pagoDate = row.created_at;
      }
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => new Date(b.pagoDate).getTime() - new Date(a.pagoDate).getTime()
  );
}

export default async function MisRifasParticipandoPage() {
  const participaciones = await loadParticipaciones();
  const totalTickets = participaciones.length;
  const pagosConfirmados = participaciones.filter(
    (p) => p.pagoStatus === "approved"
  ).length;
  const numerosTotales = participaciones.reduce(
    (acc, p) => acc + p.numbers.length,
    0
  );
  const totalInvertido = participaciones.reduce((acc, p) => acc + p.monto, 0);
  const ganadas = 0;

  const statusBadge = (s: PagoStatus) => {
    switch (s) {
      case "approved":
        return (
          <Badge
            variant="paid"
            className="!bg-emerald-100 !text-emerald-700 !border !border-emerald-200"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Pago confirmado
          </Badge>
        );
      case "pending":
      case "in_process":
        return (
          <Badge
            variant="pending"
            className="!bg-amber-100 !text-amber-700 !border !border-amber-200"
          >
            <Clock3 className="mr-1 h-3 w-3" />
            Procesando pago
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <CreditCard className="mr-1 h-3 w-3" />
            Pago rechazado
          </Badge>
        );
      case "refunded":
        return (
          <Badge variant="secondary">
            <FileCheck2 className="mr-1 h-3 w-3" />
            Reembolsado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock3 className="mr-1 h-3 w-3" />
            {s}
          </Badge>
        );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto max-w-7xl px-4 py-10 lg:py-12">
        {/* HEADER gradient cyan/rose */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-cyan via-sky-500 to-brand-rose p-7 lg:p-10 text-white shadow-xl">
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
              <Badge className="!bg-white !bg-opacity-95 !text-brand-cyan !border-0 mb-3 shadow">
                <Ticket className="mr-1.5 h-3 w-3" />
                Mis participaciones
              </Badge>
              <h1 className="font-display text-3xl font-black tracking-tight lg:text-4xl">
                Mis rifas · Historial de participaciones
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/85 lg:text-base">
                Todos tus números, pagos y tickets oficiales en un solo lugar. Si uno de tus números sale sorteado
                te contactamos en 24 horas. ¡Mucha suerte! 🍀
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="group h-12 !bg-white !text-brand-cyan hover:!bg-white/90 shadow-cta shadow-black/10"
            >
              <Link href="/rifas" className="flex items-center gap-2 font-black">
                <Gift className="h-5 w-5 transition group-hover:scale-110" strokeWidth={2.4} />
                Explorar más rifas
              </Link>
            </Button>
          </div>
        </div>

        {/* STATS 4 cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-brand-cyan" />
                Tickets activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-numbers text-3xl font-black tabular-nums tracking-tight text-brand-cyan">
                {totalTickets}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {numerosTotales} números totales jugados
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Pagos confirmados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-numbers text-3xl font-black tabular-nums tracking-tight text-emerald-600">
                {pagosConfirmados}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {totalTickets - pagosConfirmados} en proceso
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-brand-violet" />
                Invertido total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-numbers text-3xl font-black tabular-nums tracking-tight text-brand-violet">
                {formatCurrency(totalInvertido)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {totalTickets > 0
                  ? `Promedio ${formatCurrency(Math.round(totalInvertido / totalTickets))} por rifa`
                  : "Participa para ver estadísticas"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-brand-gold" />
                Premios ganados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-numbers text-3xl font-black tabular-nums tracking-tight text-amber-500">
                {ganadas}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Sigue participando · ¡la suerte te espera!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* LISTADO PARTICIPACIONES */}
        <div className="space-y-4">
          {participaciones.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-300 bg-white py-20 text-center">
              <CardContent className="mx-auto max-w-md">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-rose text-white shadow-cta">
                  <Trophy className="h-8 w-8" strokeWidth={2.2} />
                </div>
                <h3 className="font-display text-xl font-black text-slate-900">
                  ¡Aún no has participado en ninguna rifa!
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Encuentra premios increíbles o apoyar causas solidarias — elige tus
                  números favoritos y juega. 100% seguro con Mercado Pago.
                </p>
                <Button asChild size="lg" className="mt-5 h-12 font-black w-full md:w-auto">
                  <Link href="/rifas">
                    <Gift className="mr-1.5 h-5 w-5" />
                    Explorar rifas activas
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            participaciones.map((p) => {
              const country = p.rifa.creator?.country ?? "Colombia";
              const drawDate = p.rifa.draw_date ? new Date(p.rifa.draw_date) : null;
              return (
                <Card
                  key={p.id}
                  className="overflow-hidden border-slate-200 shadow-sm transition hover:border-brand-cyan/40 hover:shadow-md"
                >
                  <div className="grid gap-0 md:grid-cols-[1fr_auto]">
                    <CardHeader className="pb-4 md:pb-6 flex flex-col gap-3 md:flex-row md:items-start">
                      <div
                        className={
                          p.rifa.is_solidarity
                            ? "relative flex h-28 w-full md:h-full md:w-40 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-cyan via-emerald-400 to-brand-rose text-white"
                            : "relative flex h-28 w-full md:h-full md:w-40 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-rose via-brand-violet to-brand-cyan text-white"
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
                        <div className="relative z-10 m-auto text-center">
                          <div className="mx-auto mb-1 grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
                            {p.rifa.is_solidarity ? (
                              <Gift className="h-5 w-5" />
                            ) : (
                              <Trophy className="h-5 w-5" />
                            )}
                          </div>
                          <p className="font-numbers text-[10px] font-black uppercase tracking-wider opacity-90">
                            {country}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {statusBadge(p.pagoStatus)}
                          <Badge variant="secondary" className="font-numbers tabular-nums">
                            {p.ticket}
                          </Badge>
                          {p.rifa.is_solidarity && (
                            <Badge variant="solidarity">
                              <Gift className="mr-1 h-3 w-3" /> Solidaria
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="font-display text-lg leading-snug line-clamp-2">
                          <Link
                            href={`/rifas/${p.rifa.id}`}
                            className="transition hover:text-brand-rose"
                          >
                            {p.rifa.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs text-slate-500">
                          Organiza{" "}
                          <span className="font-semibold text-slate-600">
                            {p.rifa.creator?.full_name ?? "Anónimo"}
                          </span>{" "}
                          · Premio{" "}
                          <span className="font-semibold text-slate-800 font-numbers tabular-nums">
                            {formatCurrency(p.rifa.prize_value)}
                          </span>{" "}
                          · {p.numbers.length} número{p.numbers.length === 1 ? "" : "s"} jugados
                        </CardDescription>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {p.numbers.map((n) => (
                            <div
                              key={n}
                              className="grid h-9 w-11 place-items-center rounded-lg border-2 border-brand-cyan/50 bg-gradient-to-br from-brand-cyan/15 via-sky-50 to-brand-rose/10 font-numbers text-sm font-black text-slate-800 tabular-nums shadow-sm"
                            >
                              {n}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/60 p-4 md:p-6 md:w-64 shrink-0 flex flex-col justify-between gap-4">
                      <div className="space-y-2.5 text-xs font-semibold text-slate-500">
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3.5 w-3.5 text-brand-violet" />
                            Monto pagado
                          </span>
                          <span className="font-numbers tabular-nums text-slate-900">
                            {formatCurrency(p.monto)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-brand-rose" />
                            Fecha compra
                          </span>
                          <span className="font-numbers tabular-nums text-slate-700">
                            {new Date(p.pagoDate).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                        {drawDate && (
                          <div className="flex justify-between">
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3.5 w-3.5 text-brand-gold" />
                              Día sorteo
                            </span>
                            <span className="font-numbers tabular-nums text-slate-700">
                              {drawDate.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "short"
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        {(p.pagoStatus === "in_process" || p.pagoStatus === "pending") && (
                          <Button
                            asChild
                            className="w-full !h-10 !bg-gradient-to-r from-brand-gold via-rose-500 to-brand-violet !text-white font-black shadow-cta shadow-rose-500/30"
                          >
                            <Link
                              href={`/checkout/${p.id}?rifa_id=${p.rifa.id}&numbers=${p.numbers.join(",")}`}
                            >
                              <CreditCard className="mr-1.5 h-4 w-4" />
                              Continuar pago
                            </Link>
                          </Button>
                        )}
                        <Button
                          asChild
                          className="w-full !h-10 !bg-gradient-to-r from-brand-cyan to-brand-rose !text-white font-bold shadow-cta shadow-cyan-500/20"
                        >
                          <Link href={`/rifas/${p.rifa.id}`}>
                            <FileCheck2 className="mr-1.5 h-4 w-4" />
                            {p.pagoStatus === "approved" ? "Ver ticket oficial" : "Ver rifa"}
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full !h-10 !border-slate-300 !text-slate-700 font-bold"
                        >
                          <Link href="/rifas">
                            <Gift className="mr-1.5 h-4 w-4" />
                            Seguir participando
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
