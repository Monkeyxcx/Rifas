import assert from "node:assert/strict";
import test from "node:test";

import { evaluateWebhookSecurity } from "./security.ts";

test("rejects live webhook processing when credentials exist but secret is missing", () => {
  const decision = evaluateWebhookSecurity({
    hasCredentials: true,
    hasWebhookSecret: false,
    hasMockInline: false
  });

  assert.deepEqual(decision, { mode: "reject_missing_secret" });
});

test("keeps explicit inline mocks bypassed for non-production testing flows", () => {
  const decision = evaluateWebhookSecurity({
    hasCredentials: true,
    hasWebhookSecret: false,
    hasMockInline: true
  });

  assert.deepEqual(decision, { mode: "bypass_mock_inline" });
});

test("allows unsigned processing only when running without Mercado Pago credentials", () => {
  const decision = evaluateWebhookSecurity({
    hasCredentials: false,
    hasWebhookSecret: false,
    hasMockInline: false
  });

  assert.deepEqual(decision, { mode: "skip_signature_in_mock_mode" });
});
