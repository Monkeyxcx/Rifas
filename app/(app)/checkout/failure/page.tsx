import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  FileQuestion,
  Gift,
  Home,
  RefreshCcw,
  Ticket,
  XCircle
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

export const metadata = {
  title: "Pago rechazado · RifasCenter",
  description: "Tu pago no fue aprobado. Puedes reintentarlo sin perder tus números."
};

export const dynamic = "force-dynamic";

export default async function CheckoutFailurePage({
  searchParams
}: {
  searchParams: Promise<{
    preference_id?: string;
    external_reference?: string;
    rifa_id?: string;
    numbers?: string;
  }>;
}) {
  const sp = await searchParams;
  const preferenceId = sp.preference_id ?? "—";
  const externalReference = sp.external_reference ?? "—";
  const rifaId = sp.rifa_id ?? "";
  const numbersQuery = sp.numbers ?? "";

  const retryHref =
    rifaId && numbersQuery
      ? `/checkout/REINTENTO-${Date.now().toString(36).toUpperCase()}?rifa_id=${rifaId}&numbers=${numbersQuery}`
      : "/mis-rifas/participando";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-rose-50/30 to-slate-50">
      <div className="container mx-auto max-w-3xl px-2 sm:px-4 py-4 sm:py-6 lg:py-12">
        <div className="mb-3 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-500">
          <Link
            href="/rifas"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-brand-rose shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Rifas
          </Link>
          <span className="opacity-40 shrink-0">/</span>
          <span className="rounded-lg bg-rose-100 px-2 py-1 font-semibold text-rose-700 shrink-0">
            Pago rechazado
          </span>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-xl">
          <div className="relative bg-gradient-to-br from-rose-500 via-rose-600 to-brand-violet p-5 sm:p-8 lg:p-10 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.8) 0, transparent 40%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.6) 0, transparent 40%)"
              }}
            />
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-3.5 sm:mb-5 grid h-14 w-14 sm:h-20 sm:w-20 place-items-center rounded-full bg-white/20 backdrop-blur ring-4 ring-white/30">
                <XCircle className="h-8 w-8 sm:h-12 sm:w-12" strokeWidth={2.4} />
              </div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Badge className="!bg-white !text-rose-700 !border-0 shadow !text-[10px] sm:!text-xs py-0">
                  ❌ No aprobado
                </Badge>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight lg:text-4xl leading-tight">
                Tu pago no fue aprobado esta vez
              </h1>
              <p className="mt-1.5 sm:mt-2 max-w-xl text-xs sm:text-sm text-white/90 lg:text-base leading-relaxed">
                ¡No te preocupes! Tus números siguen reservados durante el plazo de gracia.
                Puedes reintentar el pago las veces que necesites.
              </p>
            </div>
          </div>

          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pt-4 sm:pt-8 pb-4 sm:pb-8">
            <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
              <Card className="border-2 border-dashed border-rose-200 bg-rose-50/40 shadow-sm">
                <CardHeader className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3">
                  <CardTitle className="font-display text-sm sm:text-base flex items-center gap-2 text-rose-800">
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    Motivos comunes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-3 sm:pb-4 space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs font-semibold text-rose-900/80 leading-relaxed">
                  <p>• Fondos insuficientes en la tarjeta o cuenta</p>
                  <p>• Tarjeta vencida o datos incorrectos (CSV/fecha)</p>
                  <p>• Banco rechazó por seguridad</p>
                  <p>• Límite diario o mensual alcanzado</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3">
                  <CardTitle className="font-display text-sm sm:text-base flex items-center gap-2">
                    <FileQuestion className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-violet shrink-0" />
                    ¿Qué hacer?
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-3 sm:pb-4 space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs font-semibold text-slate-600 leading-relaxed">
                  <p>1. Revisa que los datos de tu tarjeta sean correctos</p>
                  <p>2. Intenta con otro medio de pago (otra tarjeta, Pix, QR)</p>
                  <p>3. Contacta tu banco para autorizar compra online</p>
                  <p>4. Transferencia: espera la acreditación bancaria</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4 space-y-2 text-[11px] sm:text-xs">
              <div className="flex items-start justify-between text-slate-600 gap-2">
                <span className="shrink-0">Preference ID</span>
                <span className="font-mono font-bold text-slate-800 text-right break-all">
                  {preferenceId}
                </span>
              </div>
              <div className="flex items-start justify-between text-slate-600 gap-2">
                <span className="shrink-0">External Ref</span>
                <span className="font-mono font-bold text-slate-800 text-right break-all">
                  {externalReference}
                </span>
              </div>
            </div>

            <div className="grid gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <Button
                asChild
                size="lg"
                className="w-full h-10 sm:h-12 !bg-gradient-to-r from-brand-rose via-brand-violet to-brand-cyan !text-white font-black shadow-cta shadow-rose-500/30 text-xs sm:text-sm"
              >
                <Link href={retryHref}>
                  <RefreshCcw className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                  Reintentar el pago
                </Link>
              </Button>
              <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full h-10 sm:h-12 !border-slate-300 !text-slate-700 font-bold text-xs sm:text-sm"
                >
                  <Link href={rifaId ? `/rifas/${rifaId}` : "/rifas"}>
                    {rifaId ? (
                      <>
                        <Ticket className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                        Ver rifa
                      </>
                    ) : (
                      <>
                        <Home className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                        Rifas activas
                      </>
                    )}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full h-10 sm:h-12 !border-slate-300 !text-slate-700 font-bold text-xs sm:text-sm"
                >
                  <Link href="/mis-rifas/participando">
                    <CreditCard className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                    Mis reservas
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 hidden sm:flex">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="!border-slate-200 !text-slate-600 font-bold !text-xs"
              >
                <Link href="/rifas">
                  <Gift className="mr-1.5 h-4 w-4" />
                  Explorar rifas
                </Link>
              </Button>
            </div>

            <CardDescription className="pt-1 sm:pt-2 text-center text-[11px] font-semibold text-slate-400 leading-relaxed">
              Los números reservados son tuyos hasta que expire el contador de 15 minutos.
              Pasado ese plazo se liberan para otros participantes.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
