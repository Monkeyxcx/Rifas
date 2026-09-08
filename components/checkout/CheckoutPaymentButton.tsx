"use client";

import { useRef, useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { flagReservaAsPendingMP } from "@/components/checkout/MPPaymentWatcherOverlay";
import { showConfirm, showError } from "@/lib/ui/modals";

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

const POPUP_PARAMS =
  "popup,width=500,height=800,left=80,top=40,noopener,noreferrer";

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
  const [lastInitPoint, setLastInitPoint] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const lastInitPointRef = useRef<string | null>(null);

  // sync ref + state (state para render ref para closures stales)
  const syncPoint = (p: string | null) => {
    setLastInitPoint(p);
    lastInitPointRef.current = p;
  };

  const openViaSyncFormTargetBlank = (initPoint: string) => {
    try {
      if (!formRef.current) {
        const f = document.createElement("form");
        f.method = "GET";
        f.acceptCharset = "UTF-8";
        f.rel = "noopener noreferrer";
        document.body.appendChild(f);
        formRef.current = f;
      }
      const form = formRef.current;
      form.action = initPoint;
      form.target = "_blank";
      form.submit();
      return true;
    } catch (e) {
      console.warn("[MP] form submit failed", e);
      return false;
    }
  };

  const openRedirectCurrentTab = (initPoint: string) => {
    if (typeof window !== "undefined") {
      window.location.href = initPoint;
    }
  };

  const pay = async () => {
    if (loading) return;
    setLoading(true);
    setLastInitPoint(null);

    let initPoint: string | null = null;
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
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        init_point?: string;
        error?: string;
        message?: string;
        [k: string]: unknown;
      };
      if (!res.ok || !body.init_point || typeof body.init_point !== "string") {
        console.error("create-preference failed", res.status, body);
        void showError({
          title: "No se pudo generar el link de pago",
          message:
            body.error ??
            body.message ??
            "Intenta nuevamente en 10 segundos."
        });
        setLoading(false);
        return;
      }
      initPoint = body.init_point;
      syncPoint(initPoint);

      try {
        flagReservaAsPendingMP(reservaId);
      } catch {
        /* ignore */
      }

      // Estrategia 1: Ventana flotante popup (permite usuario volver y overlay vivo)
      let opened: Window | null = null;
      let openedOk = false;
      try {
        opened = window.open("", "rifasmpcheckout", POPUP_PARAMS);
        if (opened && !opened.closed) {
          opened.location.href = initPoint;
          openedOk = true;
        }
      } catch (e) {
        console.warn("[MP] window.open popup attempt failed", e);
      }

      // Estrategia 2: _blank nueva pestaña + submit <form> SYNC (mejor popup-pass ratio)
      if (!openedOk) {
        try {
          const viaForm = openViaSyncFormTargetBlank(initPoint);
          if (viaForm) {
            openedOk = true;
          }
        } catch (e) {
          console.warn("[MP] form-target-blank failed", e);
        }
      }

      // Estrategia 3: redirect misma pestaña (popup blocker estricto)
      // Preguntar primero al usuario para confirmar
      let selfRedirected = false;
      if (!openedOk) {
        const okGo = await showConfirm({
          title: "Ventanas emergentes bloqueadas",
          message:
            "Tu navegador bloqueó la ventana de Mercado Pago.\n" +
            "\nPodemos redirigirte a Mercado Pago en esta misma pestaña y al regresar RifasCenter continuará detectando el pago automáticamente.\n" +
            "\n¿Continuar en esta misma pestaña?",
          confirmText: "Continuar a Mercado Pago",
          dangerMode: false
        });
        if (okGo) {
          openRedirectCurrentTab(initPoint);
          selfRedirected = true;
        }
      }

      // Si no se abrió ni se redirigió → error genérico
      if (!openedOk && !selfRedirected) {
        syncPoint(null);
        void showError({
          title: "No se pudo abrir Mercado Pago",
          message:
            "Habilita ventanas emergentes para rifascenter.com o intenta en un navegador sin bloqueadores agresivos."
        });
      }
    } catch (e) {
      console.error(e);
      syncPoint(null);
      void showError({
        title: "Error de conexión",
        message: "Sin conexión con el servidor. Intenta nuevamente en 30 segundos."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
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

      {/* Footer helpers */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ExternalLink className="h-3 w-3 text-brand-violet" strokeWidth={2.2} />
          <span>
            Se abrirá Mercado Pago en <b>ventana nueva</b> (esta página se queda esperando el pago).
          </span>
        </div>
        {lastInitPoint && (
          <button
            type="button"
            onClick={() => {
              if (!lastInitPoint) return;
              void showConfirm({
                title: "Abrir en esta pestaña",
                message:
                  "¿Redirigirte a Mercado Pago en esta pestaña?\n(Volverás aquí después del pago).",
                confirmText: "Abrir aquí",
                dangerMode: false
              }).then((ok) => {
                if (ok && lastInitPointRef.current) {
                  openRedirectCurrentTab(lastInitPointRef.current);
                }
              });
            }}
            className="underline underline-offset-2 decoration-dotted hover:text-brand-rose hover:decoration-brand-rose font-semibold"
          >
            Prefiero abrirlo en esta pestaña
          </button>
        )}
      </div>
    </div>
  );
}
