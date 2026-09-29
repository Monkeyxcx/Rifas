"use client";

import { Loader2, WalletCards } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { showError } from "@/lib/ui/modals";
import { formatCurrency } from "@/lib/utils";

type Props = {
  rifaId: string;
  amount: number;
};

function resolveEffectiveInitPoint(body: {
  init_point?: string;
  sandbox_init_point?: string;
  testing?: boolean;
}): string | null {
  if (body.testing && body.sandbox_init_point) return body.sandbox_init_point;
  if (body.init_point) return body.init_point;
  if (body.sandbox_init_point) return body.sandbox_init_point;
  return null;
}

export default function CreatorFeePaymentButton({ rifaId, amount }: Props) {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/creator-fees/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rifa_id: rifaId })
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        init_point?: string;
        sandbox_init_point?: string;
        testing?: boolean;
        error?: string;
      };
      const initPoint = resolveEffectiveInitPoint(body);
      if (!res.ok || !initPoint) {
        void showError({
          title: "No se pudo generar el pago",
          message:
            body.error ??
            "Intenta nuevamente en unos segundos para pagar la comisión."
        });
        return;
      }

      const popup = window.open(
        initPoint,
        "creatorfeemp",
        "popup,width=500,height=800,left=80,top=40,noopener,noreferrer"
      );

      if (!popup || popup.closed) {
        window.location.href = initPoint;
      }
    } catch (error) {
      console.error(error);
      void showError({
        title: "Error de conexión",
        message: "No se pudo abrir Mercado Pago para pagar la comisión."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={pay}
      disabled={loading}
      className="w-full sm:w-auto !bg-gradient-to-r from-brand-gold via-rose-500 to-brand-violet !text-white"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Abriendo Mercado Pago...
        </>
      ) : (
        <>
          <WalletCards className="mr-2 h-4 w-4" />
          Pagar comisión · {formatCurrency(amount)}
        </>
      )}
    </Button>
  );
}
