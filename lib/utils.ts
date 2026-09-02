import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyCOP(value: number, currency = "COP"): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatCurrencyGeneric(value: number): string {
  return new Intl.NumberFormat("es-419", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatCurrency(value: number, currency = "COP"): string {
  return formatCurrencyCOP(value, currency);
}

export function padRaffleNumber(n: number | string): string {
  return String(n).padStart(2, "0");
}

export function generateRaffleNumbers(total: number): string[] {
  const safe = Math.max(10, Math.min(100, total));
  return Array.from({ length: safe }, (_, i) => padRaffleNumber(i));
}

export function formatRelativeTime(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diff = target.getTime() - Date.now();
  const abs = Math.abs(diff);
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (abs < min) return diff >= 0 ? "ahora mismo" : "hace unos segundos";
  if (abs < hr) {
    const m = Math.round(abs / min);
    return diff >= 0 ? `en ${m}m` : `hace ${m}m`;
  }
  if (abs < day) {
    const h = Math.round(abs / hr);
    return diff >= 0 ? `en ${h}h` : `hace ${h}h`;
  }
  const d = Math.round(abs / day);
  return diff >= 0 ? `en ${d}d` : `hace ${d}d`;
}

export function cnJoin(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
