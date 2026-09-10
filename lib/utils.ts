import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// FIX B#09: locale dinámico según currency code (BCP 47).
// Países con centavos habilitan 2 decimales, países sin decimales usan 0.
const CURRENCY_LOCALE_MAP: Record<string, { locale: string; decimals: number }> = {
  COP: { locale: "es-CO", decimals: 0 },
  ARS: { locale: "es-AR", decimals: 2 },
  MXN: { locale: "es-MX", decimals: 2 },
  CLP: { locale: "es-CL", decimals: 0 },
  PEN: { locale: "es-PE", decimals: 2 },
  VES: { locale: "es-VE", decimals: 2 },
  USD: { locale: "en-US", decimals: 2 },
  EUR: { locale: "es-ES", decimals: 2 },
  BOB: { locale: "es-BO", decimals: 2 },
  PYG: { locale: "es-PY", decimals: 0 },
  UYU: { locale: "es-UY", decimals: 2 }
};

export function formatCurrencyCOP(value: number, currency = "COP"): string {
  const cfg = CURRENCY_LOCALE_MAP[currency.toUpperCase()] ?? CURRENCY_LOCALE_MAP.COP;
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: cfg.decimals,
    minimumFractionDigits: cfg.decimals
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
