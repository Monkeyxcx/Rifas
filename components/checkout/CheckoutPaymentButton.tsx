"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

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
        alert(
          `Error al generar el link de pago: ${body.error ?? body.message ?? "Intenta nuevamente"}`
        );
        return;
      }
      window.location.href = body.init_point;
    } catch (e) {
      console.error(e);
      alert("Error de conexión. Intenta nuevamente en 30 segundos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
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
