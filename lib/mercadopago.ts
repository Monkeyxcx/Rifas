import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

if (!ACCESS_TOKEN) {
  // No lanzamos error para permitir build/vercel preview sin credenciales
  console.warn(
    "[mercadopago] MERCADO_PAGO_ACCESS_TOKEN no está seteado. Las llamadas fallarán en runtime."
  );
}

export const mpConfig = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
  options: { timeout: 10_000 }
});

export const mpPreference = new Preference(mpConfig);
export const mpPayment = new Payment(mpConfig);

// =====================================================
// Helpers
// =====================================================

function isLocalhostLike(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h === "localhost") return true;
    if (h === "127.0.0.1") return true;
    if (h === "[::1]") return true;
    if (/\.localhost$/i.test(h)) return true;
    return false;
  } catch {
    return /(^|\.)localhost(\/|:|$)/i.test(url) || /:\/\/127\.0\.0\.1(\/|:)/.test(url);
  }
}

const PUBLIC_TUNNEL_ENV_KEYS = [
  "MP_PUBLIC_TUNNEL_URL",
  "NEXT_PUBLIC_MP_PUBLIC_TUNNEL_URL",
  "VERCEL_URL",
  "NEXT_PUBLIC_VERCEL_URL"
];

export function resolvePublicSiteUrl(): string {
  for (const k of PUBLIC_TUNNEL_ENV_KEYS) {
    const v = process.env[k];
    if (v && typeof v === "string" && v.trim().length > 0) {
      const trimmed = v.trim().replace(/\/+$/, "");
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    }
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && env.trim().length > 0) {
    const trimmed = env.trim().replace(/\/+$/, "");
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `http://${trimmed}`;
  }
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

let localhostWarningEmitted = false;
export function emitLocalhostWarningIfNeeded(url: string): void {
  if (localhostWarningEmitted) return;
  if (!isLocalhostLike(url)) return;
  localhostWarningEmitted = true;
  // eslint-disable-next-line no-console
  console.warn(
    "\n" +
    "[mercadopago] ⚠️ ADVERTENCIA: usando `localhost` / `127.0.0.1` en `back_urls` / `notification_url`.\n" +
    "[mercadopago] Mercado Pago DOCUMENTACION OFICIAL PROHIBE localhost en modo TEST/LIVE:\n" +
    "[mercadopago]   → No aparecerá botón 'Volver al sitio' y puede fallar la redirección final con 'Algo ha salido mal'.\n" +
    "[mercadopago] SOLUCIONES (elige 1):\n" +
    "[mercadopago]  a) ngrok / cloudflared tunnel: setea MP_PUBLIC_TUNNEL_URL=https://abc123.ngrok-free.app en .env.local y reinicia next dev.\n" +
    "[mercadopago]  b) Subir a preview (Vercel/Netlify) con NEXT_PUBLIC_SITE_URL=https://tu-preview.vercel.app.\n" +
    "[mercadopago]  c) Para pruebas en local SIN retorno automático: aceptar que redirección final será rechazada y usar el watcher de pago / webhook vía túnel.\n" +
    "[mercadopago] Link doc oficial: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/configure-back-urls\n"
  );
}

export interface MercadoPagoItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  picture_url?: string;
}

export interface CreatePreferenceInput {
  items: MercadoPagoItem[];
  metadata?: Record<string, string>;
  externalReference?: string;
  payer: {
    email: string;
    name?: string;
    surname?: string;
    phone?: { number?: string; area_code?: string };
  };
  backUrls?: {
    success?: string;
    pending?: string;
    failure?: string;
  };
  notificationUrl?: string;
  expires?: boolean;
  expirationDateFrom?: string;
  expirationDateTo?: string;
}

export async function createPreference(input: CreatePreferenceInput) {
  const baseUrl = resolvePublicSiteUrl();
  emitLocalhostWarningIfNeeded(baseUrl);
  const isLocalhost = isLocalhostLike(baseUrl);
  const items = input.items.map((it) => ({
    id: it.id,
    title: it.title,
    ...(it.description ? { description: it.description } : {}),
    quantity: it.quantity,
    unit_price: it.unit_price,
    currency_id: it.currency_id || "COP",
    ...(it.picture_url ? { picture_url: it.picture_url } : {})
  }));
  const payer: Record<string, unknown> = { email: input.payer.email };
  if (input.payer.name) payer.name = input.payer.name;
  if (input.payer.surname) payer.surname = input.payer.surname;
  if (input.payer.phone && (input.payer.phone.number || input.payer.phone.area_code)) {
    const area = input.payer.phone.area_code
      ? String(input.payer.phone.area_code).replace(/\D/g, "").slice(0, 4)
      : undefined;
    const num = input.payer.phone.number
      ? String(input.payer.phone.number).replace(/\D/g, "").slice(0, 20)
      : undefined;
    const p: Record<string, unknown> = {};
    if (area) p.area_code = area;
    if (num) p.number = num;
    if (Object.keys(p).length > 0) payer.phone = p;
  }
  const defaultBackUrls = {
    success: `${baseUrl}/checkout/success`,
    pending: `${baseUrl}/checkout/pending`,
    failure: `${baseUrl}/checkout/failure`
  };
  const backUrlsVal = input.backUrls
    ? { ...defaultBackUrls, ...input.backUrls }
    : defaultBackUrls;
  const notificationUrlVal =
    input.notificationUrl || `${baseUrl}/api/mercadopago/webhook?src=mp`;

  const body: Record<string, unknown> = {
    items,
    payer,
    external_reference: input.externalReference,
    metadata: input.metadata && Object.keys(input.metadata).length
      ? input.metadata
      : { platform: "RifasCenter" },
    back_urls: backUrlsVal,
    notification_url: notificationUrlVal,
    ...(!isLocalhost ? { auto_return: "approved" } : {}),
    statement_descriptor: process.env.NEXT_PUBLIC_APP_NAME || "RifasCenter"
  };
  if (input.expires !== false) {
    body.expires = true;
    const expiresTo =
      input.expirationDateTo ?? new Date(Date.now() + 15 * 60 * 1000).toISOString();
    body.expiration_date_to = expiresTo;
    if (input.expirationDateFrom) {
      body.expiration_date_from = input.expirationDateFrom;
    }
  }
  return mpPreference.create({
    body: body as unknown as Parameters<typeof mpPreference.create>[0]["body"]
  });
}

export async function verifyWebhookSignature(
  req: Request,
  rawBody: string
): Promise<boolean> {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret || secret.includes("PLACEHOLDER")) {
    console.warn(
      "[mercadopago] MERCADO_PAGO_WEBHOOK_SECRET no seteado — rechazando webhook sin validar."
    );
    return false;
  }

  // Mercado Pago x-signature header validation
  // Docs: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks
  const signatureHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signatureHeader || !requestId) return false;

  try {
    const parts = Object.fromEntries(
      signatureHeader.split(",").map((p) => {
        const [k, v] = p.split("=");
        return [k.trim(), v.trim()];
      })
    );
    const ts = parts.ts;
    const hash = parts.v1;
    const data = `id:${requestId};request-id:${requestId};ts:${ts};payload:${rawBody}`;

    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(data)
    );
    const computed = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return computed === hash;
  } catch (err) {
    console.error("[mercadopago] firma webhook invalida", err);
    return false;
  }
}

export function isTesting(): boolean {
  return (process.env.MERCADO_PAGO_ACCESS_TOKEN || "").startsWith("TEST-");
}
