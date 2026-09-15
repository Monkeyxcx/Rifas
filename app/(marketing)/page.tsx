import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FeaturesCarousel } from "@/components/marketing/FeaturesCarousel";
import { StepsCarousel } from "@/components/marketing/StepsCarousel";

const FEATURES = [
  {
    icon: "Gift" as const,
    title: "Premios increíbles",
    description:
      "Electrónica, viajes, vehículos, experiencias únicas y más. Cientos de rifas activas al mismo tiempo.",
    bg: "bg-gradient-premio"
  },
  {
    icon: "Heart" as const,
    title: "Causas solidarias",
    description:
      "Apoya a comunidades, ONG y fundaciones. Cada número que compras se convierte en ayuda real y transparente.",
    bg: "bg-gradient-solidario"
  },
  {
    icon: "ShieldCheck" as const,
    title: "100% seguro y transparente",
    description:
      "Pagos vía Mercado Pago, números únicos por rifa y sorteos verificables con hash público y testigos.",
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
    icon: "Sparkles" as const
  },
  {
    n: "02",
    title: "Elige tus números",
    desc: "Selecciona los números de la suerte (00-99). Elige 1, 10 o todos los que quieras.",
    icon: "Ticket" as const
  },
  {
    n: "03",
    title: "Paga con Mercado Pago",
    desc: "Checkout seguro. Tarjeta, PIX, transferencia. Tu número se reserva al instante.",
    icon: "Zap" as const
  },
  {
    n: "04",
    title: "¡Suerte y gana!",
    desc: "Sorteo público y transparente. Si ganas te contactamos en 24h.",
    icon: "Gift" as const
  }
];

export default function MarketingHomePage() {
  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-28">
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

        <div className="container max-w-content pt-10 md:pt-24 pb-10 md:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1>
              Gana premios increíbles. Apoya causas que importan.
            </h1>

            <p className="mt-4 md:mt-6 text-base md:text-xl text-slate-600 max-w-2xl mx-auto">
              <span className="font-semibold text-slate-900">RifasCenter</span>{" "}
              es el lugar donde la emoción del sorteo se une al poder de ayudar.
              <span className="text-brand-rose font-semibold"> Tu número, tu premio, tu causa.</span>
            </p>

            <div className="mt-7 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
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
          </div>

          {/* STATS */}
          <div className="mx-auto mt-10 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-5xl">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="card-base !shadow-md text-center py-4 md:py-6 px-3 md:px-4"
              >
                <div className="font-display text-2xl md:text-4xl font-extrabold bg-gradient-cta bg-clip-text text-transparent">
                  {s.kpi}
                </div>
                <div className="mt-1 text-xs md:text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES 3 COLUMNAS
          ===================================================== */}
      <section className="container max-w-content py-10 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-8 md:mb-14">
          <h2 className="!text-2xl md:!text-4xl">
            Todo lo que necesitas, en un solo lugar.
          </h2>
          <p className="mt-3 md:mt-4 text-slate-600 text-base md:text-lg">
            Simple para participar, potente para crear. Diseñado para que el foco esté en la emoción y la ayuda, no en los trámites.
          </p>
        </div>

        <FeaturesCarousel features={FEATURES} />
      </section>

      <Separator className="container max-w-content !bg-slate-200" />

      {/* =====================================================
          CÓMO FUNCIONA — 4 PASOS
          ===================================================== */}
      <section className="container max-w-content py-10 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-8 md:mb-14">
          <h2 className="!text-2xl md:!text-4xl">
            Participa en 4 pasos, en menos de 2 minutos.
          </h2>
        </div>

        <StepsCarousel steps={STEPS} />
      </section>

      {/* =====================================================
          CTA FINAL
          ===================================================== */}
      <section className="container max-w-content pt-2 md:pt-0 pb-12 md:pb-20">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl gradient-hero p-6 md:p-14 text-center shadow-xl">
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
            <h2 className="text-solid !text-white !text-2xl md:!text-5xl">
              ¿Listo para ganar y ayudar?
            </h2>
            <p className="mx-auto mt-3 md:mt-5 max-w-xl text-white/85 text-base md:text-lg">
              Crea tu cuenta gratis y empieza a participar en rifas de premios o a
              recaudar fondos por la causa que te importa.
            </p>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
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
                className="!bg-transparent border-2 border-white/80 text-white hover:bg-white/10 hover:text-white"
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
