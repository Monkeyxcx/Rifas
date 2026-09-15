"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ExternalLink, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { flagReservaAsPendingMP } from "@/components/checkout/MPPaymentWatcherOverlay";
import { showError } from "@/lib/ui/modals";

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

function isCheckoutReturnPath(pathname: string): boolean {
  return (
    pathname.startsWith("/checkout/success") ||
    pathname.startsWith("/checkout/pending") ||
    pathname.startsWith("/checkout/failure")
  );
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initPoint, setInitPoint] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [iframeBlockedHint, setIframeBlockedHint] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const blockHintTimerRef = useRef<number | null>(null);

  const clearBlockHintTimer = useCallback(() => {
    if (blockHintTimerRef.current != null) {
      window.clearTimeout(blockHintTimerRef.current);
      blockHintTimerRef.current = null;
    }
  }, []);

  const closeModal = useCallback(() => {
    clearBlockHintTimer();
    setModalOpen(false);
    setIframeReady(false);
    setIframeBlockedHint(false);
  }, [clearBlockHintTimer]);

  const handleIframeNavigation = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    try {
      const href = frame.contentWindow?.location?.href ?? "";
      const path = frame.contentWindow?.location?.pathname ?? "";
      const search = frame.contentWindow?.location?.search ?? "";
      if (!href || href === "about:blank") return;

      // Same-origin return from Mercado Pago back_urls
      if (isCheckoutReturnPath(path)) {
        closeModal();
        router.push(`${path}${search}`);
        return;
      }

      // Same-origin mock preference lands directly on success
      if (path.startsWith("/checkout/")) {
        setIframeReady(true);
        clearBlockHintTimer();
        setIframeBlockedHint(false);
      }
    } catch {
      // Cross-origin (still on mercadopago.com) — expected while paying
      setIframeReady(true);
      clearBlockHintTimer();
      setIframeBlockedHint(false);
    }
  }, [clearBlockHintTimer, closeModal, router]);

  useEffect(() => {
    if (!modalOpen || !initPoint) return;
    clearBlockHintTimer();
    setIframeBlockedHint(false);
    setIframeReady(false);
    // If CSP blocks the frame, onLoad may never fire usefully — nudge after a few seconds
    blockHintTimerRef.current = window.setTimeout(() => {
      setIframeBlockedHint(true);
    }, 4500);
    return clearBlockHintTimer;
  }, [modalOpen, initPoint, clearBlockHintTimer]);

  const openInSameTab = () => {
    if (!initPoint) return;
    window.location.href = initPoint;
  };

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
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        init_point?: string;
        sandbox_init_point?: string;
        testing?: boolean;
        error?: string;
        message?: string;
      };
      const point = resolveEffectiveInitPoint(body);
      if (!res.ok || !point) {
        console.error("create-preference failed", res.status, body);
        void showError({
          title: "No se pudo generar el link de pago",
          message:
            body.error ??
            body.message ??
            "Intenta nuevamente en 10 segundos."
        });
        return;
      }

      try {
        flagReservaAsPendingMP(reservaId);
      } catch {
        /* ignore */
      }

      setInitPoint(point);
      setModalOpen(true);
    } catch (e) {
      console.error(e);
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
        onClick={() => void pay()}
        className="group relative h-14 w-full !bg-gradient-to-r from-brand-gold via-rose-500 to-brand-violet text-base font-black text-white shadow-cta shadow-rose-500/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
        <span className="relative flex items-center justify-center gap-2.5">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.3} />
              Generando checkout seguro…
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" strokeWidth={2.3} />
              Pagar con Mercado Pago ·{" "}
              <span className="font-numbers tabular-nums">
                {formatCurrency(total, currency)}
              </span>
            </>
          )}
        </span>
      </Button>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
        <ExternalLink className="h-3 w-3 text-brand-violet shrink-0" strokeWidth={2.2} />
        <span>
          El checkout de Mercado Pago se abre en un <b>modal</b> en esta misma página.
        </span>
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
          else setModalOpen(true);
        }}
      >
        <DialogContent className="flex h-[min(92vh,880px)] w-[min(96vw,720px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <DialogHeader className="shrink-0 border-b border-slate-200 px-4 py-3 pr-12 text-left sm:px-5">
            <DialogTitle className="text-base sm:text-lg">
              Pago seguro · Mercado Pago
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Completa el pago aquí. Esta página seguirá esperando la confirmación.
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-0 flex-1 bg-slate-50">
            {!iframeReady && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-[2px]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
                <p className="text-sm font-semibold text-slate-700">
                  Cargando Mercado Pago…
                </p>
              </div>
            )}

            {initPoint && (
              <iframe
                ref={iframeRef}
                key={initPoint}
                src={initPoint}
                title="Checkout Mercado Pago"
                className="h-full w-full border-0 bg-white"
                allow="payment *; publickey-credentials-get *; clipboard-write"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={handleIframeNavigation}
              />
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
            {iframeBlockedHint && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Si no ves el formulario de pago, Mercado Pago puede estar bloqueando
                el iframe en tu navegador. Usa una de las opciones de abajo.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <X className="h-3.5 w-3.5" />
                Cerrar y seguir esperando el pago
              </button>
              <div className="flex flex-wrap gap-2">
                {initPoint && (
                  <a
                    href={initPoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Abrir en pestaña nueva
                  </a>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-9"
                  onClick={openInSameTab}
                  disabled={!initPoint}
                >
                  Continuar en esta pestaña
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
