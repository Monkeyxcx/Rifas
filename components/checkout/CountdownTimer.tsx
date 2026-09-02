"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CountdownTimerProps {
  expiresAt: string | Date;
  className?: string;
  onExpire?: () => void;
  variant?: "default" | "urgent" | "expired";
}

function parseExpiry(expiresAt: string | Date): number {
  const d = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return d.getTime();
}

function calcRemaining(targetMs: number) {
  const now = Date.now();
  const total = Math.max(0, targetMs - now);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  return { total, minutes, seconds, expired: total === 0 };
}

export default function CountdownTimer({
  expiresAt,
  className,
  onExpire,
  variant = "default"
}: CountdownTimerProps) {
  const targetMs = useMemo(() => parseExpiry(expiresAt), [expiresAt]);
  const [state, setState] = useState(() => calcRemaining(targetMs));

  useEffect(() => {
    setState(calcRemaining(targetMs));
    let called = false;
    const tick = () => setState((prev) => {
      const next = calcRemaining(targetMs);
      if (next.expired && !prev.expired && !called && onExpire) {
        called = true;
        queueMicrotask(onExpire);
      }
      return next;
    });
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs, onExpire]);

  const mm = String(state.minutes).padStart(2, "0");
  const ss = String(state.seconds).padStart(2, "0");

  const effectiveVariant: CountdownTimerProps["variant"] = state.expired
    ? "expired"
    : state.total < 3 * 60 * 1000
    ? "urgent"
    : variant;

  const styles = {
    default:
      "border-emerald-200 bg-emerald-50 text-emerald-900",
    urgent:
      "border-brand-rose/30 bg-gradient-to-r from-brand-rose/10 to-brand-gold/10 text-brand-rose",
    expired:
      "border-slate-300 bg-slate-100 text-slate-500"
  }[effectiveVariant];

  const Icon =
    effectiveVariant === "expired"
      ? AlertTriangle
      : effectiveVariant === "urgent"
      ? AlertTriangle
      : state.total < 5 * 60 * 1000
      ? Clock3
      : CheckCircle2;

  const label = state.expired
    ? "Tiempo agotado · tu reserva se liberó"
    : effectiveVariant === "urgent"
    ? "¡Date prisa! Tu reserva vence pronto"
    : "Tienes tiempo para completar tu pago · reserva bloqueada";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 backdrop-blur",
        styles,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          effectiveVariant === "expired"
            ? "bg-slate-200 text-slate-600"
            : effectiveVariant === "urgent"
            ? "bg-brand-rose/15 text-brand-rose"
            : "bg-emerald-100 text-emerald-600"
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.3} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
          Tiempo restante
        </p>
        <p className="mt-0.5 text-lg font-bold font-numbers tabular-nums tracking-tight">
          <span className="text-2xl">{mm}</span>
          <span className="mx-1 opacity-60">:</span>
          <span className="text-2xl">{ss}</span>
          <span className="ml-2 text-sm font-medium opacity-80">minutos</span>
        </p>
        <p className="mt-1 text-xs font-medium opacity-80 truncate">{label}</p>
      </div>
    </div>
  );
}
