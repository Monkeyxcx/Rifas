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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return mpPreference.create({
    body: {
      items: input.items.map((it) => ({
        id: it.id,
        title: it.title,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        currency_id: it.currency_id || "COP",
        picture_url: it.picture_url
      })),
      payer: input.payer,
      external_reference: input.externalReference,
      metadata: input.metadata,
      back_urls: input.backUrls || {
        success: `${baseUrl}/checkout/success`,
        pending: `${baseUrl}/checkout/pending`,
        failure: `${baseUrl}/checkout/failure`
      },
      notification_url:
        input.notificationUrl ||
        `${baseUrl}/api/mercadopago/webhook?src=mp`,
      auto_return: "approved",
      binary_mode: false,
      expires: input.expires ?? true,
      expiration_date_from: input.expirationDateFrom,
      expiration_date_to:
        input.expirationDateTo ??
        new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      statement_descriptor:
        process.env.NEXT_PUBLIC_APP_NAME || "RifasCenter"
    }
  });
}

export async function verifyWebhookSignature(
  req: Request,
  rawBody: string
): Promise<boolean> {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[mercadopago] MERCADO_PAGO_WEBHOOK_SECRET no seteado — webhook sin validar."
    );
    return true;
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
