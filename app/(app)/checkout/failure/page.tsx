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
          <span className="rounded-lg bg-rose-100 px-2 py-1 font-semibold text-rose-700">
            Pago rechazado
          </span>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-xl">
          <div className="relative bg-gradient-to-br from-rose-500 via-rose-600 to-brand-violet p-8 lg:p-10 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.8) 0, transparent 40%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.6) 0, transparent 40%)"
              }}
            />
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-white/20 backdrop-blur ring-4 ring-white/30">
                <XCircle className="h-12 w-12" strokeWidth={2.4} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="!bg-white !text-rose-700 !border-0 shadow-lg">
                  ❌ No aprobado
                </Badge>
              </div>
              <h1 className="font-display text-3xl font-black tracking-tight lg:text-4xl">
                Tu pago no fue aprobado esta vez
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/90 lg:text-base">
                ¡No te preocupes! Tus números siguen reservados durante el plazo de gracia.
                Puedes reintentar el pago las veces que necesites.
              </p>
            </div>
          </div>

          <CardContent className="space-y-6 pt-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-2 border-dashed border-rose-200 bg-rose-50/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2 text-rose-800">
                    <AlertTriangle className="h-4 w-4" />
                    Motivos más comunes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs font-semibold text-rose-900/80">
                  <p>• Fondos insuficientes en la tarjeta o cuenta</p>
                  <p>• Tarjeta vencida o datos incorrectos (CSV/fecha)</p>
                  <p>• Banco rechazó la transacción por seguridad</p>
                  <p>• Límite diario o mensual de compras alcanzado</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 text-brand-violet" />
                    ¿Qué hacer ahora?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs font-semibold text-slate-600">
                  <p>1. Revisa que los datos de tu tarjeta sean correctos</p>
                  <p>2. Intenta con otro medio de pago (otra tarjeta, Pix, QR)</p>
                  <p>3. Contacta tu banco para autorizar la compra online</p>
                  <p>4. Si usaste transferencia, espera la acreditación</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

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

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <Button
                asChild
                size="lg"
                className="sm:col-span-2 w-full h-12 !bg-gradient-to-r from-brand-rose via-brand-violet to-brand-cyan !text-white font-black shadow-cta shadow-rose-500/30"
              >
                <Link href={retryHref}>
                  <RefreshCcw className="mr-1.5 h-5 w-5" />
                  Reintentar el pago
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full h-12 !border-slate-300 !text-slate-700 font-bold"
              >
                <Link href={rifaId ? `/rifas/${rifaId}` : "/rifas"}>
                  {rifaId ? (
                    <>
                      <Ticket className="mr-1.5 h-5 w-5" />
                      Ver rifa
                    </>
                  ) : (
                    <>
                      <Home className="mr-1.5 h-5 w-5" />
                      Volver al inicio
                    </>
                  )}
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="!border-slate-200 !text-slate-600 font-bold"
              >
                <Link href="/mis-rifas/participando">
                  <CreditCard className="mr-1.5 h-4 w-4" />
                  Mis reservas
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="!border-slate-200 !text-slate-600 font-bold"
              >
                <Link href="/rifas">
                  <Gift className="mr-1.5 h-4 w-4" />
                  Explorar más rifas
                </Link>
              </Button>
            </div>

            <CardDescription className="pt-2 text-center text-[11px] font-semibold text-slate-400">
              Los números reservados son tuyos hasta que expire el contador de 15 minutos.
              Pasado ese plazo se liberan para otros participantes.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
