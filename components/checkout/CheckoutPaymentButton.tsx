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
const POPUP_NAME = "rifasmpcheckout";
const POPUP_ABOUT_BLANK_CHECK_MS = 600;

function resolveEffectiveInitPoint(body: {
  init_point?: string;
  sandbox_init_point?: string;
  testing?: boolean;
}): string | null {
  if (body.testing && body.sandbox_init_point && typeof body.sandbox_init_point === "string") {
    return body.sandbox_init_point;
  }
  if (body.init_point && typeof body.init_point === "string") return body.init_point;
  if (body.sandbox_init_point && typeof body.sandbox_init_point === "string") {
    return body.sandbox_init_point;
  }
  return null;
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
  const [lastInitPoint, setLastInitPoint] = useState<string | null>(null);
  const lastInitPointRef = useRef<string | null>(null);
  const openedWindowRef = useRef<Window | null>(null);

  const syncPoint = (p: string | null) => {
    setLastInitPoint(p);
    lastInitPointRef.current = p;
  };

  const openViaSyncAnchorClick = (initPoint: string): boolean => {
    try {
      const a = document.createElement("a");
      a.href = initPoint;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      const evt = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        button: 0
      });
      const dispatched = a.dispatchEvent(evt);
      document.body.removeChild(a);
      return dispatched !== false;
    } catch (e) {
      console.warn("[MP] anchor dispatch click fallback failed", e);
      return false;
    }
  };

  const openRedirectCurrentTab = (initPoint: string) => {
    if (typeof window !== "undefined") {
      window.location.href = initPoint;
    }
  };

  const copyInitPointToClipboard = async (initPoint: string) => {
    try {
      await navigator.clipboard.writeText(initPoint);
      return true;
    } catch {
        return false;
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
        sandbox_init_point?: string;
        testing?: boolean;
        error?: string;
        message?: string;
        [k: string]: unknown;
      };
      initPoint = resolveEffectiveInitPoint(body);
      if (!res.ok || !initPoint) {
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
      syncPoint(initPoint);

      try {
        flagReservaAsPendingMP(reservaId);
      } catch {
        /* ignore */
      }

      // Estrategia 1: window.open DIRECTAMENTE con la URL de MP (nunca about:blank primero)
      let openedOk = false;
      try {
        const opened = window.open(initPoint, POPUP_NAME, POPUP_PARAMS);
        if (opened && !opened.closed) {
          openedWindowRef.current = opened;
          openedOk = true;
          window.setTimeout(() => {
            try {
              if (opened && !opened.closed) {
                const href = String((opened as unknown as { location?: { href?: string } }).location?.href ?? "");
                if (!href || href === "" || href === "about:blank") {
                  console.warn("[MP] popup quedó about:blank, intentando anchor click fallback.");
                  void openViaSyncAnchorClick(initPoint!);
                }
              }
            } catch {
              // cross-origin → significa que MP ya cargó (bien)
            }
          }, POPUP_ABOUT_BLANK_CHECK_MS);
        }
      } catch (e) {
        console.warn("[MP] window.open popup attempt failed", e);
      }

      // Estrategia 2: <a target=_blank> click programático (mejor bypass popup blockers)
      if (!openedOk) {
        try {
          const viaAnchor = openViaSyncAnchorClick(initPoint);
          if (viaAnchor) {
            openedOk = true;
          }
        } catch (e) {
          console.warn("[MP] anchor-click-target-blank failed", e);
        }
      }

      // Estrategia 3: redirect misma pestaña (popup blocker estricto)
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

      // Estrategia 4 (último recurso): link manual + copiar al portapapeles
      if (!openedOk && !selfRedirected) {
        const copied = await copyInitPointToClipboard(initPoint);
        const prefix = copied
          ? "Se copió el link de pago al portapapeles.\n\n"
          : "Copia el link de pago a mano:\n\n";
        const suffix =
          "\n\nAbre una pestaña nueva, pégalo y accede a Mercado Pago. Al terminar el pago regresarás aquí.";
        void showError({
          title: "Abre el link manualmente",
          html:
            (prefix + initPoint + suffix).replace(/[&<>]/g, (c) =>
              c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"
            ).replace(/\n/g, "<br/>")
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
          <div className="flex items-center gap-3">
            <a
              href={lastInitPoint}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 decoration-dotted hover:text-brand-rose hover:decoration-brand-rose font-semibold"
            >
              Abrir link MP directamente
            </a>
            <button
              type="button"
              onClick={() => {
                if (!lastInitPointRef.current) return;
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
          </div>
        )}
      </div>
    </div>
  );
}
