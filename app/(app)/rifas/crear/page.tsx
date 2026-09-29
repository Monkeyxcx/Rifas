import PaymentMethodsToggles from "@/components/nequi/PaymentMethodsToggles";
import CreatorForm from "@/components/rifas/CreatorForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { RifaPaymentMethods, UserNequiVerification } from "@/lib/types";
import { AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Crear tu rifa · RifasCenter",
  description:
    "Crea una rifa en 4 pasos: premio o causa solidaria, números, fechas y listo."
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ editar?: string }>;
};

export default async function CrearRifaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const editingId = sp?.editar?.trim() || null;
  const isEditing = Boolean(editingId);

  const sb = await createClient();
  const {
    data: { user },
    error: uErr
  } = await sb.auth.getUser();
  if (uErr || !user) redirect("/auth?redirectTo=%2Frifas%2Fcrear");

  // Cobros manuales aprobados
  let manualVerified = false;
  let latestVerification: UserNequiVerification | null = null;
  const { data: nequiRows, error: nequiErr } = await sb
    .from("user_nequi_verifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (!nequiErr && nequiRows?.length) {
    latestVerification = nequiRows[0] as UserNequiVerification;
    manualVerified = latestVerification.status === "approved";
  }

  // Cargar methods actuales si editing
  let paymentMethods: RifaPaymentMethods | null = null;
  if (editingId) {
    const { data: m, error: mErr } = await sb
      .from("rifa_payment_methods")
      .select("*")
      .eq("rifa_id", editingId)
      .maybeSingle();
    if (!mErr && m) paymentMethods = m as RifaPaymentMethods;
  }

  return (
    <div className="relative">
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-brand-rose/10 via-white to-brand-violet/10 dark:border-slate-800 dark:from-brand-rose/20 dark:via-slate-950 dark:to-brand-violet/20">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgb(255_27_81_/_0.15)_1px,transparent_0)] [background-size:22px_22px] dark:opacity-20" />
        <div className="container relative max-w-content py-10">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/rifas" className="hover:text-brand-rose transition">
              Rifas activas
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            {isEditing ? (
              <>
                <Link
                  href="/mis-rifas/creadas"
                  className="hover:text-brand-rose transition"
                >
                  Mis rifas creadas
                </Link>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-slate-800 font-medium">Editar rifa</span>
              </>
            ) : (
              <span className="text-slate-800 font-medium">Crear rifa</span>
            )}
          </nav>

          {isEditing ? (
            <>
              <h1 className="text-solid font-display font-black text-3xl md:text-4xl text-slate-900 leading-[1.05] max-w-3xl">
                Edita tu rifa y{" "}
                <span className="bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent">
                  mejora sus chances
                </span>{" "}
                de vender más
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600 text-sm md:text-base leading-relaxed">
                Ajusta el título, sube la foto real del premio, corrige fechas o cambia el
                precio por número. Los números ya vendidos y las reservas en curso se mantienen intactas.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-solid font-display font-black text-3xl md:text-4xl text-slate-900 leading-[1.05] max-w-3xl">
                Crea una rifa para un{" "}
                <span className="bg-gradient-to-r from-brand-rose to-brand-violet bg-clip-text text-transparent">
                  premio increíble
                </span>{" "}
                o una{" "}
                <span className="bg-gradient-to-r from-brand-cyan to-brand-rose bg-clip-text text-transparent">
                  causa solidaria
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600 text-sm md:text-base leading-relaxed">
                Tú eliges el premio, cuántos números (entre 10 y 100), cuánto cuesta cada
                uno y cuándo se sortea. Tus participantes te pagan directo por Nequi o
                Bancolombia, y la plataforma usa Mercado Pago solo para cobrar la comisión
                del 3% al creador cuando la rifa llega a 50 ventas pagadas.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="container max-w-content py-10 space-y-8">
        <CreatorForm editingId={editingId} />

        {editingId ? (
          <PaymentMethodsToggles
            rifaId={editingId}
            manualVerified={manualVerified}
            defaultMethods={paymentMethods}
            latestVerification={latestVerification}
          />
        ) : (
          <Card className="border-dashed border-slate-200 bg-gradient-to-br from-slate-50/60 via-white to-slate-50/40 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" /> Métodos de pago
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Podrás activar tus cobros manuales después de crear tu rifa.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Nota:</span> Si
                quieres cobrar directamente por <b>Nequi</b> o <b>Bancolombia</b>, sube
                primero tu verificación de cobros manuales en tu{" "}
                <Link href="/perfil#cobros-manuales" className="text-brand-rose font-bold underline">
                  panel de perfil
                </Link>
                . Un administrador la aprobará para que puedas activarlo en tus rifas.
              </div>
              {!manualVerified ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <b>Todavía no tienes cobros manuales aprobados.</b> Activa primero tu
                    verificación si quieres cobrar directamente por Nequi o Bancolombia.
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
