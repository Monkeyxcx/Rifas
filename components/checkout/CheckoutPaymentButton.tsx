"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { flagReservaAsPendingMP } from "@/components/checkout/MPPaymentWatcherOverlay";

interface Props {
  reservaId: string;
  rifaId: string;
  numbers: string[];
  total: number;
  currency: string;
  payerEmail: string;
  payerName: string;
  payerPhone: string;
}

export default function CheckoutPaymentButton({
  reservaId,
  rifaId,
  numbers,
  total,
  currency,
  payerEmail,
  payerName,
  payerPhone
}: Props) {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    if (loading) return;
    setLoading(true);

    // RC doble pestaña / doble ruta de pago FIX:
    // Los popup blockers NUNCA permiten window.open después de un
    // `await fetch()` async porque ya perdió el "user gesture stack".
    //
    // Solución canónica: ABRIR VENTANA SÍNCRONA about:blank EN CLICK
    // SYNC (antes del fetch). Luego cuando tenemos init_point,
    // hacemos mpWin.location.href = init_point.
    //
    // Si popup bloquea el about:blank tampoco → toast y NO navegamos
    // current tab away (el watcher de polling debe permanecer vivo).
    let mpWin: Window | null = null;
    try {
      mpWin = window.open("about:blank", "_blank", "noopener,noreferrer");
    } catch {
      mpWin = null;
    }

    if (!mpWin) {
      setLoading(false);
      toast.error(
        "Tu navegador bloqueó la ventana de Mercado Pago. " +
        "Habilita las ventanas emergentes para rifascenter.com y vuelve a intentar."
      );
      return;
    }

    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reserva_id: reservaId,
          rifa_id: rifaId,
          numbers,
          payer_email: payerEmail || undefined,
          payer_name: payerName || undefined,
          payer_phone: payerPhone || undefined
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.init_point) {
        console.error("create-preference failed", res.status, body);
        try { mpWin.close(); } catch { /* ignore */ }
        toast.error(
          `Error al generar el link de pago: ${body.error ?? body.message ?? "Intenta nuevamente"}`
        );
        return;
      }
      try {
        flagReservaAsPendingMP(reservaId);
      } catch { /* ignore */ }
      try {
        mpWin.location.href = body.init_point;
      } catch {
        toast.error(
          "Error al redirigir a Mercado Pago desde la nueva ventana. " +
          "Vuelve a intentar pulsando el botón."
        );
        try { mpWin.close(); } catch { /* ignore */ }
      }
    } catch (e) {
      console.error(e);
      try { mpWin.close(); } catch { /* ignore */ }
      toast.error("Error de conexión. Intenta nuevamente en 30 segundos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size="lg"
      disabled={loading}
      onClick={pay}
      className="group relative h-14 w-full !bg-gradient-to-r from-brand-gold via-rose-500 to-brand-violet text-base font-black text-white shadow-cta shadow-rose-500/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
      <span className="relative flex items-center justify-center gap-2.5">
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.3} />
            Generando link seguro Mercado Pago…
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" strokeWidth={2.3} />
            💳 Pagar con Mercado Pago ·{" "}
            <span className="font-numbers tabular-nums">
              {formatCurrency(total, currency)}
            </span>
          </>
        )}
      </span>
    </Button>
  );
}
