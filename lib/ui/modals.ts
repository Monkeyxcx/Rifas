// ================================================================
// Wrapper centralizado SweetAlert2.
// Intercepta alerts invisibles <div role=alert> y reemplaza por Swal
// modales grandes, con botón OK visible y colores brand RifasCenter.
// ================================================================
import Swal, { SweetAlertIcon, SweetAlertOptions } from "sweetalert2";

const BRAND_ROSE = "#e11d48";
const BRAND_SUCCESS = "#059669";
const BRAND_DANGER = "#dc2626";
const BRAND_INFO = "#2563eb";
const BRAND_WARN = "#d97706";
const BRAND_VIOLET = "#7c3aed";

export type SwalLevel = SweetAlertIcon;

const baseStyle: SweetAlertOptions = {
  confirmButtonColor: BRAND_ROSE,
  cancelButtonColor: "#64748b",
  denyButtonColor: BRAND_DANGER,
  customClass: {
    popup:
      "!rounded-2xl !border !border-slate-200/80 !shadow-2xl !font-sans",
    title:
      "!font-bold !tracking-tight !text-slate-900 !text-2xl",
    htmlContainer: "!text-slate-700 !text-base !leading-relaxed",
    confirmButton:
      "!h-11 !rounded-xl !px-6 !font-semibold !transition hover:!brightness-110 active:!scale-[0.98]",
    cancelButton:
      "!h-11 !rounded-xl !px-5 !font-semibold !border !border-slate-300 !bg-white !text-slate-700 hover:!bg-slate-50 active:!scale-[0.98]",
    denyButton: "!h-11 !rounded-xl !px-5 !font-semibold",
    closeButton: "!text-slate-500",
    validationMessage: "!text-sm"
  },
  buttonsStyling: true,
  reverseButtons: false,
  backdrop: true,
  allowOutsideClick: false,
  allowEscapeKey: true,
  focusConfirm: true,
  scrollbarPadding: true,
  heightAuto: false,
  showCloseButton: true
};

export function showAlert(params: {
  title?: string;
  message?: string;
  html?: string;
  level?: SwalLevel;
  confirmText?: string;
  footer?: string;
  timer?: number;
  onClose?: () => void;
}) {
  const {
    title,
    message,
    html,
    level = "info",
    confirmText = "Entendido",
    footer,
    timer,
    onClose
  } = params;

  const iconColor =
    level === "success"
      ? BRAND_SUCCESS
      : level === "error"
        ? BRAND_DANGER
        : level === "warning"
          ? BRAND_WARN
          : level === "question"
            ? BRAND_VIOLET
            : BRAND_INFO;

  return Swal.fire({
    ...baseStyle,
    icon: level,
    iconColor,
    title: title ?? defaultTitle(level),
    text: html ? undefined : message,
    html,
    confirmButtonText: confirmText,
    footer,
    timer,
    timerProgressBar: Boolean(timer),
    didClose: () => onClose?.()
  });
}

export function showSuccess(p: {
  title?: string;
  message?: string;
  html?: string;
  confirmText?: string;
  timer?: number;
  onClose?: () => void;
}) {
  return showAlert({ level: "success", title: p.title ?? "¡Listo!", ...p });
}

export function showError(p: {
  title?: string;
  message: string;
  html?: string;
  confirmText?: string;
  onClose?: () => void;
}) {
  return showAlert({ level: "error", title: p.title ?? "Oops, algo salió mal", ...p });
}

export function showWarning(p: {
  title?: string;
  message: string;
  html?: string;
  confirmText?: string;
  onClose?: () => void;
}) {
  return showAlert({ level: "warning", title: p.title ?? "Atención", ...p });
}

export function showInfo(p: {
  title?: string;
  message: string;
  html?: string;
  confirmText?: string;
  onClose?: () => void;
}) {
  return showAlert({ level: "info", title: p.title ?? "Información", ...p });
}

export async function showConfirm(p: {
  title?: string;
  message?: string;
  html?: string;
  confirmText?: string;
  cancelText?: string;
  level?: SwalLevel;
  dangerMode?: boolean;
}): Promise<boolean> {
  const r = await Swal.fire({
    ...baseStyle,
    icon: p.level ?? "question",
    title: p.title ?? "¿Estás seguro?",
    text: p.html ? undefined : p.message,
    html: p.html,
    showCancelButton: true,
    confirmButtonText: p.confirmText ?? "Sí, continuar",
    cancelButtonText: p.cancelText ?? "Cancelar",
    confirmButtonColor: p.dangerMode ? BRAND_DANGER : BRAND_ROSE
  });
  return Boolean(r.isConfirmed);
}

export const modalToast = {
  success: (msg: string, title?: string, opts?: { timer?: number }) =>
    showSuccess({ title, message: msg, timer: opts?.timer }),
  error: (msg: string, title?: string) => showError({ title, message: msg }),
  warning: (msg: string, title?: string) => showWarning({ title, message: msg }),
  info: (msg: string, title?: string) => showInfo({ title, message: msg })
};

function defaultTitle(level: SwalLevel): string {
  switch (level) {
    case "success": return "¡Éxito!";
    case "error": return "Error";
    case "warning": return "Ten cuidado";
    case "question": return "¿Confirmar?";
    default: return "Información";
  }
}

// -------- Intercepta alerts invisibles del Auth UI Supabase --------
// El componente <Auth/> inyecta div[role=alert] pequeños casi invisibles.
// MutationObserver detecta estos alerts y los re-lanza como SweetAlert
// grande con OK.
let authAlertObserver: MutationObserver | null = null;
let lastAlertKey = "";

export function enableAuthUiAlertBridge() {
  if (typeof window === "undefined") return;
  if (authAlertObserver) return;

  const fire = (el: HTMLElement) => {
    const text = (el.innerText || el.textContent || "").trim();
    if (!text) return;
    const clsHtml = `${el.className ?? ""} ${el.innerHTML}`;
    const isErr =
      /(danger|error|fail|invalid|wrong|not|expired|incorrect|23505|already|conflict|unable)/i.test(
        clsHtml + " " + text
      );
    const isOk =
      /(success|created|sent|correct|green|emerald|check|confirm|enviad|registr|cread)/i.test(
        clsHtml + " " + text
      );
    const key = `${text.length}:${text.slice(0, 70)}:${isErr ? "e" : isOk ? "o" : "i"}`;
    if (key === lastAlertKey) return;
    lastAlertKey = key;
    setTimeout(() => {
      if (isErr) void showError({ title: "Error en autenticación", message: text });
      else if (isOk) void showSuccess({ title: "Aviso", message: text, timer: 3400 });
      else void showInfo({ title: "Mensaje", message: text });
    }, 60);
  };

  document.querySelectorAll<HTMLElement>("[role='alert']").forEach(fire);

  authAlertObserver = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.getAttribute("role") === "alert") fire(n);
        else n.querySelectorAll<HTMLElement>("[role='alert']").forEach(fire);
      });
    }
  });
  authAlertObserver.observe(document.documentElement, {
    subtree: true,
    childList: true
  });
}

export function closeAllAlerts() {
  return Swal.close();
}
