import Link from "next/link";
import {
  Ticket,
  Gift,
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Users,
  Clock,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    icon: Gift,
    title: "Premios increíbles",
    description:
      "Electrónica, viajes, vehículos, experiencias únicas y más. Cientos de rifas activas al mismo tiempo.",
    color: "from-brand-gold to-brand-rose text-white",
    bg: "bg-gradient-premio"
  },
  {
    icon: Heart,
    title: "Causas solidarias",
    description:
      "Apoya a comunidades, ONG y fundaciones. Cada número que compras se convierte en ayuda real y transparente.",
    color: "from-brand-violet to-brand-cyan text-white",
    bg: "bg-gradient-solidario"
  },
  {
    icon: ShieldCheck,
    title: "100% seguro y transparente",
    description:
      "Pagos vía Mercado Pago, números únicos por rifa y sorteos verificables con hash público y testigos.",
    color: "from-brand-cyan to-brand-rose text-white",
    bg: "bg-gradient-cta"
  }
];

const STATS = [
  { kpi: "+12.500", label: "Usuarios registrados" },
  { kpi: "+3.200", label: "Rifas finalizadas" },
  { kpi: "+$2.100M", label: "Entregados en premios" },
  { kpi: "98%", label: "Satisfacción ganadores" }
];

const STEPS = [
  {
    n: "01",
    title: "Explora rifas",
    desc: "Busca por premio, causa solidaria o precio. Filtra hasta encontrar la tuya.",
    icon: Sparkles
  },
  {
    n: "02",
    title: "Elige tus números",
    desc: "Selecciona los números de la suerte (00-99). Elige 1, 10 o todos los que quieras.",
    icon: Ticket
  },
  {
    n: "03",
    title: "Paga con Mercado Pago",
    desc: "Checkout seguro. Tarjeta, PIX, transferencia. Tu número se reserva al instante.",
    icon: Zap
  },
  {
    n: "04",
    title: "¡Suerte y gana!",
    desc: "Sorteo público y transparente. Si ganas te contactamos en 24h.",
    icon: Gift
  }
];

export default function MarketingHomePage() {
  return (
    <div className="flex-1 flex flex-col pb-28">
      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl"
        >
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] gradient-hero opacity-30" />
        </div>

        <div className="container max-w-content pt-16 md:pt-24 pb-16 md:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="solidarity" className="mb-6 animate-pulse-soft">
              <Sparkles className="h-3.5 w-3.5" />
              Beta abierta — ¡Regístrate gratis!
            </Badge>

            <h1>
              Gana premios increíbles.{" "}
              <span className="bg-gradient-cta bg-clip-text text-transparent">
                Apoya causas que importan.
              </span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              <span className="font-semibold text-slate-900">RifasCenter</span>{" "}
              es el lugar donde la emoción del sorteo se une al poder de ayudar.
              <span className="text-brand-rose font-semibold"> Tu número, tu premio, tu causa.</span>
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild variant="gradient" size="lg">
                <Link href="/rifas">
                  Ver rifas activas
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/rifas/crear">
                  <Ticket className="h-5 w-5" />
                  Crear mi rifa
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-success" />
                Pagos protegidos Mercado Pago
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-brand-violet" />
                Sin costos de inscripción
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-cyan" />
                Sorteos en fecha y hora pública
              </span>
            </div>
          </div>

          {/* STATS */}
          <div className="mx-auto mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="card-base !shadow-md text-center py-6 px-4"
              >
                <div className="font-display text-3xl md:text-4xl font-extrabold bg-gradient-cta bg-clip-text text-transparent">
                  {s.kpi}
                </div>
                <div className="mt-1.5 text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES 3 COLUMNAS
          ===================================================== */}
      <section className="container max-w-content py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <Badge variant="new" className="mb-4">
            ¿Por qué RifasCenter?
          </Badge>
          <h2 className="!text-3xl md:!text-4xl">
            Todo lo que necesitas, en un solo lugar.
          </h2>
          <p className="mt-4 text-slate-600 text-lg">
            Simple para participar, potente para crear. Diseñado para que el foco esté en la emoción y la ayuda, no en los trámites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card-base p-6 group">
                <div
                  className={`grid h-14 w-14 place-items-center rounded-xl ${f.bg} shadow-md mb-5`}
                >
                  <Icon className="h-7 w-7 text-white" strokeWidth={2.3} />
                </div>
                <h3>{f.title}</h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <Separator className="container max-w-content !bg-slate-200" />

      {/* =====================================================
          CÓMO FUNCIONA — 4 PASOS
          ===================================================== */}
      <section className="container max-w-content py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <Badge variant="outline" className="mb-4">
            ¿Cómo funciona?
          </Badge>
          <h2 className="!text-3xl md:!text-4xl">
            Participa en 4 pasos, en menos de 2 minutos.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="relative card-base p-6 overflow-hidden"
              >
                <div className="absolute -right-4 -top-6 font-display font-extrabold text-[120px] leading-none text-slate-100 select-none">
                  {s.n}
                </div>
                <div className="relative">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-brand-rose mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="!text-lg">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-14 -right-10 h-6 w-6 text-slate-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          CTA FINAL
          ===================================================== */}
      <section className="container max-w-content pb-20">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-8 md:p-14 text-center shadow-xl">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
              backgroundSize: "28px 28px"
            }}
          />
          <div className="relative">
            <Badge className="bg-white/20 text-white backdrop-blur !border !border-white/30 mb-6">
              ✨ Sin costo para empezar
            </Badge>
            <h2 className="!text-white !text-3xl md:!text-5xl">
              ¿Listo para ganar y ayudar?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/85 text-lg">
              Crea tu cuenta gratis y empieza a participar en rifas de premios o a
              recaudar fondos por la causa que te importa.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-brand-rose hover:bg-rose-50">
                <Link href="/rifas">
                  Explorar rifas ahora
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white/80 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/rifas/crear">Crear rifa solidaria</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
