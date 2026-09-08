"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PartyPopper, AlertTriangle, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { showSuccess, showWarning } from "@/lib/ui/modals";

type ReservaStatusResp = {
  ok: boolean;
  reserva_id?: string;
  rifa_id?: string;
  rifa_title?: string | null;
  rifa_number_price?: number | null;
  status?: "reserved" | "paid" | "cancelled" | "expired" | "refunded";
  expires_at?: string;
  numbers?: string[];
  pago?: null | {
    id?: string;
    mercado_pago_payment_id?: string | null;
    status?: string;
    amount?: number;
    fee_amount?: number;
    net_received_amount?: number;
    created_at?: string;
  };
  ts?: string;
  error?: string;
};

export default function MPPaymentWatcherOverlay({
  reservaId,
  rifaId,
  initialStatus = "reserved",
  numbers,
  unitPrice: _unitPrice,
  totalAmount,
  currency = "COP"
}: {
  reservaId: string;
  rifaId: string;
  initialStatus?: "reserved" | "paid" | "cancelled" | "expired" | "refunded";
  numbers: string[];
  unitPrice: number;
  totalAmount: number;
  currency?: string;
}) {
  const router = useRouter();
  const startedPollingRef = useRef(false);
  const [uiState, setUiState] = useState<
    "idle" | "polling" | "paid" | "expired" | "cancelled" | "refunded" | "error"
  >(initialStatus === "paid" ? "paid" : initialStatus === "expired" ? "expired" : "idle");
  const [latest, setLatest] = useState<ReservaStatusResp | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);

  const buildSuccessUrl = useCallback(
    (r: ReservaStatusResp) => {
      const params = new URLSearchParams();
      if (r.rifa_id) params.set("rifa_id", r.rifa_id);
      const nums = (r.numbers && r.numbers.length ? r.numbers : numbers).join(",");
      if (nums) params.set("numbers", nums);
      if (r.pago?.mercado_pago_payment_id) params.set("payment_id", String(r.pago.mercado_pago_payment_id));
      if (r.reserva_id) params.set("external_reference", r.reserva_id);
      return `/checkout/success?${params.toString()}`;
    },
    [numbers]
  );

  const startPolling = useCallback(() => {
    if (startedPollingRef.current) return;
    startedPollingRef.current = true;
    setUiState("polling");
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 60 * 5; // 5min con interval 2s
    const tick = async () => {
      if (cancelled) return;
      try {
        attempts += 1;
        setPollCount(attempts);
        const resp = await fetch(`/api/reservas/${encodeURIComponent(reservaId)}/status`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { "x-rifas-poll": "1" }
        });
        const json = (await resp.json().catch(() => ({ ok: false, error: "parse" }))) as ReservaStatusResp;
        setLatest(json);
        if (resp.status === 401) {
          setUiState("error");
          cancelled = true;
          return;
        }
        if (json.ok && json.status === "paid") {
          setUiState("paid");
          cancelled = true;
          void showSuccess({
            title: "¡Pago aprobado! 🎉",
            html:
              `Se confirmó tu pago por <b>${formatCurrency(totalAmount, currency)}</b><br/>` +
              `Rifa: <b>${json.rifa_title ?? ""}</b>` +
              (json.numbers?.length ? ` · ${json.numbers.length} número(s)` : ""),
            timer: 2600,
            onClose: () => router.push(buildSuccessUrl(json))
          });
          return;
        }
        if (json.ok && (json.status === "expired" || json.status === "cancelled" || json.status === "refunded")) {
          setUiState(json.status as "expired" | "cancelled" | "refunded");
          cancelled = true;
          return;
        }
        if (json.ok && json.pago && (json.pago.status === "rejected" || json.pago.status === "cancelled")) {
          void showWarning({
            title: "Pago rechazado",
            message: `Intenta nuevamente con otra tarjeta. Status banco: ${json.pago.status}.`
          });
        }
      } catch (e) {
        console.warn("[MPWatcher] poll error", e);
      } finally {
        if (!cancelled && attempts < MAX_ATTEMPTS) {
          setTimeout(tick, 2000);
        } else if (!cancelled) {
          setUiState("error");
        }
      }
    };
    void tick();
  }, [reservaId, router, buildSuccessUrl]);

  useEffect(() => {
    // Si el user ya clicleó el botón pagar MP → localStorage marca iniciar polling
    const KEY = `rifas:mp-pending:${reservaId}`;
    const existing = window.localStorage.getItem(KEY);
    if (existing || uiState === "paid") {
      startPolling();
    }
    // Tambien escuchar mensaje cross-tab desde CheckoutPaymentButton cuando abre nueva pestana MP
    const handler = (ev: StorageEvent) => {
      if (ev.key === KEY) startPolling();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [reservaId, uiState, startPolling]);

  // Solo mostrar UI cuando hay algo más que idle
  if (uiState === "idle") return null;

  return (
    <div className="pointer-events-auto z-50 mt-4 w-full">
      {uiState === "polling" && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-brand-cyan/20 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-brand-gold text-white shadow">
              <Loader2 className="h-5 w-5 animate-spin stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-black text-amber-900 leading-tight">
                  Esperando confirmación del pago…
                </p>
                <Badge className="!h-5 !bg-amber-100 !text-amber-800 !border !border-amber-200 !px-2 text-[10px] font-bold">
                  {formatCurrency(totalAmount, currency)}
                </Badge>
              </div>
              <p className="mt-1 text-xs font-semibold text-amber-800/90">
                Completaste el pago en la pestaña de Mercado Pago. En cuanto el banco confirme (⏱ ~2s a 2 min), aquí aparecerá tu ticket automáticamente.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="!h-6 !text-[11px] font-bold text-slate-600 tabular-nums">
                  Poll #{pollCount}
                </Badge>
                {latest?.pago?.status && (
                  <Badge
                    className={
                      "!h-6 !text-[11px] font-bold " +
                      (latest.pago.status === "approved" || latest.pago.status === "in_process"
                        ? "!bg-emerald-100 !text-emerald-800 !border-emerald-200"
                        : latest.pago.status === "rejected"
                        ? "!bg-rose-100 !text-rose-800 !border-rose-200"
                        : "!bg-slate-100 !text-slate-700 !border-slate-200")
                    }
                  >
                    Banco: {latest.pago.status}
                  </Badge>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="!h-8 !rounded-xl !border-amber-300 !bg-white/70 !text-amber-900 hover:!bg-white font-bold ml-auto"
                  onClick={() => {
                    startedPollingRef.current = false;
                    startPolling();
                  }}
                >
                  Reintentar polling
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {uiState === "paid" && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-brand-cyan/30 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-brand-cyan text-white shadow-cta">
              <CheckCircle2 className="h-5 w-5 stroke-[2.4]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-emerald-900 leading-tight">
                🎉 ¡Pago confirmado automáticamente!
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-800/90">
                Redirigiendo a tu comprobante oficial ahora… Si no sucede, usa el botón.
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    router.push(
                      latest
                        ? buildSuccessUrl(latest)
                        : `/checkout/success?rifa_id=${rifaId}&numbers=${numbers.join(",")}&external_reference=${reservaId}`
                    )
                  }
                  className="!h-9 !rounded-xl font-black !bg-gradient-to-br from-emerald-500 to-brand-cyan !text-white shadow"
                >
                  Ver mi ticket ahora →
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {uiState === "expired" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-700">
              <Clock3 className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-800 leading-tight">
                Reserva vencida
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                El tiempo de reserva se agotó antes de confirmar el pago. Los números fueron liberados, puedes volver a seleccionarlos.
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  size="sm"
                  asChild
                  className="!h-9 !rounded-xl font-black !bg-gradient-to-r from-brand-rose to-brand-violet !text-white shadow"
                >
                  <a href={`/rifas/${rifaId}`}>Volver a seleccionar números</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(uiState === "cancelled" || uiState === "refunded") && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-rose-900 leading-tight">
                {uiState === "refunded" ? "Reembolso procesado" : "Reserva cancelada"}
              </p>
              <p className="mt-1 text-xs font-semibold text-rose-800/90">
                Esta operación fue {uiState === "refunded" ? "reembolsada" : "cancelada"}. Puedes intentar nuevamente si lo deseas.
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  size="sm"
                  asChild
                  className="!h-9 !rounded-xl font-black !bg-gradient-to-r from-brand-rose to-brand-violet !text-white shadow"
                >
                  <a href={`/rifas/${rifaId}`}>Intentar nuevamente</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {uiState === "error" && (
        <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-rose-900 leading-tight">
                No pudimos confirmar el pago automáticamente
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-700">
                Revisa <b>Mis Rifas → Participando</b> para confirmar el estado de tus números. También puedes revisar el correo de confirmación de Mercado Pago.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="!h-9 !rounded-xl font-bold !border-slate-300 !text-slate-700"
                  onClick={() => {
                    startedPollingRef.current = false;
                    startPolling();
                  }}
                >
                  Reintentar polling
                </Button>
                <Button
                  type="button"
                  size="sm"
                  asChild
                  className="!h-9 !rounded-xl font-black !bg-gradient-to-br from-brand-rose to-brand-violet !text-white shadow"
                >
                  <a href="/mis-rifas/participando">Ver mis rifas</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper export: función que dispara CheckoutPaymentButton cuando abre el MP en nueva pestaña
export function flagReservaAsPendingMP(reservaId: string) {
  if (typeof window === "undefined") return;
  try {
    const KEY = `rifas:mp-pending:${reservaId}`;
    window.localStorage.setItem(KEY, new Date().toISOString());
    // Cross-tab notify
    try { window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "1" })); } catch { /* ignore */ }
  } catch { /* ignore */ }
}

export function clearReservaAsPendingMP(reservaId: string) {
  if (typeof window === "undefined") return;
  try {
    const KEY = `rifas:mp-pending:${reservaId}`;
    window.localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}
