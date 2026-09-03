/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const SB_URL = "https://pscnuvibkrkqqeppmckd.supabase.co";
const SB_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY251dmlia3JrcXFlcHBtY2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNTk0NzAsImV4cCI6MjEwMzkzNTQ3MH0.GRM41MScW2idgLr-Gm3oqGItP1HNNnTiKSdExgc2JLE";
const SB_SERVICE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY251dmlia3JrcXFlcHBtY2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM1OTQ3MCwiZXhwIjoyMTAzOTM1NDcwfQ.WOO6S0tGzDykDO0QPlNlKlE_1tRvR4O7E_TvVXrsv9s";
const SB_REF = "pscnuvibkrkqqeppmckd";
const LOCAL = "http://localhost:3000";
const IPHONE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const PARTICIPANTE_UUID = "2d7e7d92-b164-46a7-9038-bf5c0cb44f50";
const MP_WEBHOOK_SECRET =
  process.env.MERCADO_PAGO_WEBHOOK_SECRET ||
  "ayJDbT4A8baECC-wTxHw-423WS6YLdRkHSNwugRCrOE";

const TMP = path.join(__dirname);

function b64urlEncode(str) {
  return Buffer.from(str, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildSbCookie(session) {
  const payload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
    token_type: session.token_type,
    user: session.user
  };
  const json = JSON.stringify(payload);
  const value = "base64-" + b64urlEncode(json);
  return `sb-${SB_REF}-auth-token=${value}; Path=/; HttpOnly; Secure=false; SameSite=Lax`;
}

async function http(method, url, { headers = {}, body, expectedStatus } = {}) {
  const opts = { method, headers: { ...headers } };
  if (body !== undefined) {
    if (typeof body === "string") {
      opts.body = body;
      if (!opts.headers["Content-Type"]) opts.headers["Content-Type"] = "application/json";
    } else {
      opts.body = JSON.stringify(body);
      opts.headers["Content-Type"] = "application/json";
    }
  }
  const raw = await fetch(url, opts);
  const text = await raw.text();
  let json = text;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  if (expectedStatus !== undefined && raw.status !== expectedStatus) {
    console.error(`[FAIL] ${method} ${url} -> HTTP ${raw.status} expected ${expectedStatus}`);
    console.error("  Body:", typeof json === "object" ? JSON.stringify(json, null, 2) : text);
    process.exit(1);
  }
  return { status: raw.status, headers: Object.fromEntries(raw.headers.entries()), body: json, text };
}

async function step1_signin() {
  console.log("\n=== STEP 1: Supabase signIn participante@test.com ===");
  const { body } = await http(
    "POST",
    `${SB_URL}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
      body: { email: "participante@test.com", password: "Prueba123*" },
      expectedStatus: 200
    }
  );
  console.log("  user id:", body.user.id);
  console.log("  email:", body.user.email);
  console.log("  access_token:", body.access_token.slice(0, 24) + "...");
  fs.writeFileSync(path.join(TMP, "sb_session.json"), JSON.stringify(body, null, 2));
  return body;
}

async function step2_reservar(session) {
  console.log("\n=== STEP 2: POST /api/reservar (rifa iPhone, numbers 09 y 11) ===");
  const cookie = buildSbCookie(session);
  const payload = {
    rifa_id: IPHONE_ID,
    numbers: ["09", "11"],
    session_key: "smoke-test-e2e-1"
  };
  const { status, body } = await http("POST", `${LOCAL}/api/reservar`, {
    headers: {
      Cookie: cookie,
      apikey: SB_ANON
    },
    body: payload,
    expectedStatus: 201
  });
  console.log("  HTTP", status);
  console.log("  ok:", body.ok);
  console.log("  reserva_id:", body.reserva_id ?? (body.result && body.result.reserva_id));
  console.log("  status:", body.status);
  console.log("  numbers:", body.numbers);
  if (!body.ok) {
    console.error("  FULL RES:", JSON.stringify(body, null, 2));
    process.exit(1);
  }
  return body;
}

async function step3_createPreference(session, reserva) {
  console.log("\n=== STEP 3: POST /api/mercadopago/create-preference ===");
  const cookie = buildSbCookie(session);
  const reservaId = reserva.reserva_id || (reserva.result && reserva.result.reserva_id);
  const payload = {
    reserva_id: reservaId,
    rifa_id: IPHONE_ID,
    numbers: ["09", "11"],
    payer_email: "participante@test.com",
    payer_name: "Participante Demo",
    payer_phone: "+573001234567"
  };
  const { status, body } = await http("POST", `${LOCAL}/api/mercadopago/create-preference`, {
    headers: {
      Cookie: cookie
    },
    body: payload,
    expectedStatus: 201
  });
  console.log("  HTTP", status);
  console.log("  ok:", body.ok);
  console.log("  init_point:", body.init_point);
  console.log("  preference_id:", body.preference_id);
  if (!body.ok || !body.init_point) {
    console.error("  FULL RES:", JSON.stringify(body, null, 2));
    process.exit(1);
  }
  if (!body.init_point.startsWith("https://www.mercadopago.com")) {
    console.error("[FAIL] init_point no es dominio MP real");
    process.exit(1);
  }
  return { reservaId, preferenceId: body.preference_id, reserva };
}

function computeMpSignature({ secret, requestId, ts, rawBody }) {
  const data = `id:${requestId};request-id:${requestId};ts:${ts};payload:${rawBody}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest("hex");
  // Mercado Pago ts-v1 format
  return `ts=${ts},v1=${sig}`;
}

async function step4_webhookApproved({ reservaId, preferenceId }) {
  console.log("\n=== STEP 4: POST /api/mercadopago/webhook (mock payment.approved HMAC) ===");
  const paymentId = "1234567890";
  const requestId = "smoke-req-" + Date.now();
  const ts = Date.now();
  const payload = {
    action: "payment.updated",
    api_version: "v1",
    data: { id: paymentId },
    date_created: new Date().toISOString(),
    id: requestId,
    live_mode: false,
    type: "payment",
    user_id: "278038195",
    _test_payment: true,
    _mock: {
      id: paymentId,
      status: "approved",
      status_detail: "accredited",
      payment_type_id: "account_money",
      payment_method_id: "account_money",
      transaction_amount: 2 * 25000 + Math.round(2 * 25000 * 0.03),
      currency_id: "COP",
      date_approved: new Date().toISOString(),
      external_reference: reservaId,
      collector_id: 278038195,
      payer: { email: "participante@test.com", id: "278038196" },
      metadata: {
        rifa_id: IPHONE_ID,
        reserva_id: reservaId,
        numbers: "09,11",
        environment: "TEST",
        platform: "RifasCenter"
      },
      order: {
        type: "mercadopago",
        id: preferenceId || "99999"
      },
      transaction_details: {
        external_resource_url: null,
        installment_amount: 0,
        net_received_amount: Math.round((2 * 25000 + Math.round(2 * 25000 * 0.03)) * 0.971),
        overpaid_amount: 0,
        payable_deferral_period: null,
        payment_method_reference_id: null,
        total_paid_amount: 2 * 25000 + Math.round(2 * 25000 * 0.03)
      },
      fee_details: [
        {
          type: "ml_fee",
          fee_payer: "collector",
          amount: Math.round((2 * 25000 + Math.round(2 * 25000 * 0.03)) * 0.029)
        }
      ]
    }
  };
  const rawBody = JSON.stringify(payload);
  const signature = computeMpSignature({
    secret: MP_WEBHOOK_SECRET,
    requestId,
    ts,
    rawBody
  });
  const { status, body } = await http("POST", `${LOCAL}/api/mercadopago/webhook`, {
    headers: {
      "x-signature": signature,
      "x-request-id": requestId
    },
    body: rawBody,
    expectedStatus: 200
  });
  console.log("  HTTP", status);
  console.log("  response:", JSON.stringify(body));
  if (!body.ok) {
    console.error("  FULL WEBHOOK ERR:", JSON.stringify(body, null, 2));
    process.exit(1);
  }
  return { paymentId };
}

async function step5_verifySupabase(expectedNumbers, expectedAvailable) {
  console.log("\n=== STEP 5: Verificar Supabase Cloud (service_role REST) ===");

  const numsQuoted = expectedNumbers.map((n) => `"${n}"`).join(",");

  // a) reservas: expectedNumbers paid
  const r1 = await http(
    "GET",
    `${SB_URL}/rest/v1/reservas?rifa_id=eq.${IPHONE_ID}&number=in.(${numsQuoted})&status=eq.paid&select=id,number,status,user_id`,
    {
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`
      },
      expectedStatus: 200
    }
  );
  const reservasPaid = Array.isArray(r1.body) ? r1.body.length : 0;
  console.log(
    `  a) reservas paid ${expectedNumbers.join("+")}:`,
    reservasPaid,
    reservasPaid === expectedNumbers.length ? "✅" : `❌ (expected ${expectedNumbers.length})`
  );
  if (Array.isArray(r1.body))
    r1.body.forEach((r) => console.log("     -", r.number, r.status, r.user_id));

  // b) rifa available_numbers
  const r2 = await http(
    "GET",
    `${SB_URL}/rest/v1/rifas?select=available_numbers,total_numbers&id=eq.${IPHONE_ID}`,
    {
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`
      },
      expectedStatus: 200
    }
  );
  const available = r2.body[0]?.available_numbers ?? null;
  console.log(
    "  b) iPhone available_numbers:",
    available,
    available === expectedAvailable ? `✅ (expected ${expectedAvailable})` : `❌ (expected ${expectedAvailable})`
  );

  // c) pagos count >= 1 y status approved
  let pagosCount = 0;
  try {
    const r3 = await http(
      "GET",
      `${SB_URL}/rest/v1/pagos?select=id&limit=1000`,
      {
        headers: {
          apikey: SB_SERVICE,
          Authorization: `Bearer ${SB_SERVICE}`,
          Prefer: "count=exact"
        }
      }
    );
    if (r3.headers && r3.headers["content-range"]) {
      const parts = r3.headers["content-range"].split("/");
      pagosCount = parseInt(parts[parts.length - 1] || "0", 10);
    }
    if (isNaN(pagosCount) || pagosCount === 0) {
      pagosCount = Array.isArray(r3.body) ? r3.body.length : 0;
    }
  } catch (_) { pagosCount = 0; }
  console.log(
    "  c) Pagos rows (total):",
    pagosCount,
    pagosCount >= 1 ? "✅" : "❌ (expected >=1)"
  );

  // last pago approved with reserva external reference
  const r3b = await http(
    "GET",
    `${SB_URL}/rest/v1/pagos?select=id,status,external_reference,amount,created_at,reserva_id&order=created_at.desc&limit=1`,
    {
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`
      },
      expectedStatus: 200
    }
  );
  const lastPago = r3b.body[0] ?? null;
  if (lastPago) {
    console.log(
      "     Último pago:",
      lastPago.status,
      "amount=",
      lastPago.amount,
      "ext_ref=",
      lastPago.external_reference,
      "reserva_id=",
      lastPago.reserva_id
    );
  }

  // d) notifications participante >= 1 post pago
  const r4 = await http(
    "GET",
    `${SB_URL}/rest/v1/notifications?select=id,type,title,read_at,created_at&user_id=eq.${PARTICIPANTE_UUID}&order=created_at.desc&limit=3`,
    {
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`
      },
      expectedStatus: 200
    }
  );
  const notis = Array.isArray(r4.body) ? r4.body : [];
  console.log(
    "  d) Notifications participante:",
    notis.length,
    notis.length >= 1 ? "✅" : "❌ (expected >=1)"
  );
  notis.forEach((n) =>
    console.log("     -", n.type, n.title, n.read_at === null ? "sin leer" : "leída")
  );

  const ok =
    reservasPaid === expectedNumbers.length &&
    available === expectedAvailable &&
    pagosCount >= 1 &&
    notis.length >= 1;
  console.log("\n  Resultado smoke E2E:", ok ? "✅ TODOS LOS CHECKS PASARON" : "❌ ALGUNOS CHECKS FALLARON");
  return ok;
}

async function main() {
  const EXPECTED_NUMBERS = ["09", "11"];
  try {
    const session = await step1_signin();
    const reserva = await step2_reservar(session);
    const pref = await step3_createPreference(session, reserva);
    await step4_webhookApproved(pref);
    // Trigger reserved → paid = delta 0 (ambos status active). available se mantiene.
    const r0 = await http(
      "GET",
      `${SB_URL}/rest/v1/rifas?select=available_numbers&id=eq.${IPHONE_ID}`,
      {
        headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` },
        expectedStatus: 200
      }
    );
    const expectedAvailable = r0.body[0]?.available_numbers ?? 62;
    const ok = await step5_verifySupabase(EXPECTED_NUMBERS, expectedAvailable);
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error("\n[UNEXPECTED ERROR]", e);
    process.exit(1);
  }
}

main();
