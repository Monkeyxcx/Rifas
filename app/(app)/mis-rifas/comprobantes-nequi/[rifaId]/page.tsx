import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ReceiptText, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import VoucherReviewList from "@/components/nequi/VoucherReviewList";
import type { NequiPayment } from "@/lib/types";
import { getManualPaymentLabel } from "@/lib/manual-payments";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ rifaId: string }>;
};

export default async function RifaComprobantesPage({ params }: PageProps) {
  const rifaId = (await params)?.rifaId;
  if (!rifaId) return redirect("/mis-rifas/creadas");

  const sb = await createClient();
  const {
    data: { user },
    error: uErr
  } = await sb.auth.getUser();
  if (uErr || !user)
    redirect("/auth?redirectTo=%2Fmis-rifas%2Fcomprobantes-nequi%2F" + rifaId);

  // Cargar rifa con creator_id
  const { data: rifaRaw, error: rErr } = await sb
    .from("rifas")
    .select("id, title, creator_id, total_numbers, number_price")
    .eq("id", rifaId)
    .maybeSingle();
  const rifa = rifaRaw as
    | {
        id: string;
        title: string;
        creator_id: string;
        total_numbers: number;
        number_price: number;
      }
    | null;
  if (rErr || !rifa) return redirect("/mis-rifas/creadas");

  if (rifa.creator_id !== user.id) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="h-5 w-5" /> Acceso no autorizado
            </CardTitle>
            <CardDescription>
              Solo el creador de la rifa puede validar comprobantes de pago.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/mis-rifas/creadas">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mis rifas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Comprobar métodos manuales activos
  const { data: methods } = await sb
    .from("rifa_payment_methods")
    .select("accept_nequi, accept_bancolombia_qr, accept_bancolombia_transfer")
    .eq("rifa_id", rifaId)
    .maybeSingle();
  const manualMethods = [
    Boolean((methods as any)?.accept_nequi) ? "nequi" : null,
    Boolean((methods as any)?.accept_bancolombia_qr) ? "bancolombia_qr" : null,
    Boolean((methods as any)?.accept_bancolombia_transfer) ? "bancolombia_transfer" : null
  ].filter(Boolean) as Array<"nequi" | "bancolombia_qr" | "bancolombia_transfer">;

  // Cargar lista de pagos manuales
  const { data: paymentsRows, error: pErr } = await sb
    .from("nequi_payments")
    .select(
      "id, rifa_id, user_id, payment_method_type, reserva_ids, numbers, amount, voucher_image_url, payer_phone, voucher_reference, status, review_notes, reviewed_at, reviewed_by, created_at, updated_at, user:profiles!nequi_payments_user_id_fkey(id, full_name, avatar_url)"
    )
    .eq("rifa_id", rifaId)
    .order("created_at", { ascending: false });
  if (pErr) {
    console.error("nequi payments list err", pErr);
  }
  const payments = (paymentsRows || []) as unknown as NequiPayment[];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto max-w-7xl px-4 py-10 lg:py-12">
        <div className="mb-8 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Button asChild variant="link" className="!p-0 !h-7 text-xs !text-slate-500">
              <Link href="/mis-rifas/creadas">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Volver a mis rifas
              </Link>
            </Button>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge className="!bg-emerald-500 !text-white !border-0 text-xs">
                <ReceiptText className="mr-1 h-3 w-3" /> Comprobantes manuales
              </Badge>
              {manualMethods.length === 0 ? (
                <Badge variant="outline" className="!border-amber-300 !text-amber-700 !bg-amber-50">
                  Sin métodos manuales activos
                </Badge>
              ) : (
                manualMethods.map((method) => (
                  <Badge key={method} variant="outline" className="!border-slate-300 !bg-white !text-slate-700">
                    {getManualPaymentLabel(method)}
                  </Badge>
                ))
              )}
            </div>
            <h1 className="mt-3 font-display font-black tracking-tight text-2xl lg:text-3xl text-slate-900 leading-tight">
              {rifa.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Valida los comprobantes enviados por los participantes por Nequi o
              Bancolombia. Cuando apruebas uno, sus reservas se marcan automáticamente
              como pagadas.
            </p>
          </div>
          <Button asChild variant="outline" className="!border-slate-200">
            <Link href={`/rifas/crear?editar=${rifaId}`}>
              Editar cobros manuales
            </Link>
          </Button>
        </div>

        <VoucherReviewList
          rifaId={rifaId}
          rifaTitle={rifa.title}
          payments={payments}
          creatorUserId={rifa.creator_id}
        />
      </div>
    </main>
  );
}
