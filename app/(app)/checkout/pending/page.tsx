import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Home,
  Mail,
  Phone,
  ShieldCheck,
  Ticket
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

export const metadata = {
  title: "Pago pendiente · RifasCenter",
  description: "Tu pago está siendo procesado por Mercado Pago."
};

export default async function CheckoutPendingPage({
  searchParams
}: {
  searchParams: Promise<{
    preference_id?: string;
    external_reference?: string;
  }>;
}) {
  const sp = await searchParams;
  const preferenceId = sp.preference_id ?? "—";
  const externalReference = sp.external_reference ?? "—";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-amber-50/40 to-slate-50">
      <div className="container mx-auto max-w-3xl px-4 py-10 lg:py-14">
        <div className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            href="/rifas"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-brand-rose"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a rifas
          </Link>
          <span className="opacity-40">/</span>
          <span className="rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-700">
            Pago pendiente
          </span>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-xl">
          <div className="relative bg-gradient-to-br from-brand-gold via-amber-500 to-orange-500 p-8 lg:p-10 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                backgroundSize: "18px 18px"
              }}
            />
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-white/20 backdrop-blur ring-4 ring-white/30">
                <Clock3 className="h-12 w-12 animate-pulse" strokeWidth={2.2} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="!bg-white !text-amber-700 !border-0 shadow-lg">
                  ⏳ Procesando
                </Badge>
              </div>
              <h1 className="font-display text-3xl font-black tracking-tight lg:text-4xl">
                Tu pago está en proceso
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/90 lg:text-base">
                Mercado Pago está validando la transacción. Este paso puede tardar
                entre unos minutos y hasta 24 horas (transferencias/PagoEfectivo).
              </p>
            </div>
          </div>

          <CardContent className="space-y-6 pt-8">
            <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <ShieldCheck className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <div className="space-y-2 text-sm text-amber-900">
                  <p className="font-black leading-tight">
                    ✅ Tus números siguen bloqueados. ¡No vuelvas a reservarlos!
                  </p>
                  <p className="font-semibold text-amber-900/80">
                    Recibirás una notificación push y email cuando el pago sea aprobado.
                    En ese momento tu reserva pasará automáticamente a estado{" "}
                    <b>PAGADO</b> y los números serán oficialmente tuyos.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Mail className="h-4 w-4 text-brand-violet" />
                    Por email
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs font-semibold text-slate-600">
                  Revisa la bandeja de entrada de tu correo registrado (incluye Spam/Promociones).
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Phone className="h-4 w-4 text-brand-rose" />
                    Por notificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs font-semibold text-slate-600">
                  Entra a <b>Mis Rifas</b> y revisa el estado de tus participaciones en tiempo real.
                </CardContent>
              </Card>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Preference ID</span>
                <span className="font-mono font-bold text-slate-800 break-all">
                  {preferenceId}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>External Ref</span>
                <span className="font-mono font-bold text-slate-800 break-all">
                  {externalReference}
                </span>
              </div>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <Button
                asChild
                size="lg"
                className="w-full h-12 !bg-gradient-to-r from-brand-gold via-amber-500 to-brand-rose !text-white font-black shadow-cta shadow-amber-500/30"
              >
                <Link href="/mis-rifas/participando">
                  <Ticket className="mr-1.5 h-5 w-5" />
                  Revisar mis rifas
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full h-12 !border-slate-300 !text-slate-700 font-bold"
              >
                <Link href="/rifas">
                  <Home className="mr-1.5 h-5 w-5" />
                  Volver al inicio
                </Link>
              </Button>
            </div>

            <CardDescription className="pt-2 text-center text-[11px] font-semibold text-slate-400">
              Si el pago es rechazado, recibirás un email y podrás reintentar desde
              Mis Rifas sin perder tus números.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
