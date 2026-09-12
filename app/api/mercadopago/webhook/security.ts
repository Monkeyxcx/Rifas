export type WebhookSecurityDecision =
  | { mode: "bypass_mock_inline" }
  | { mode: "reject_missing_secret" }
  | { mode: "verify_signature" }
  | { mode: "skip_signature_in_mock_mode" };

type EvaluateWebhookSecurityInput = {
  hasCredentials: boolean;
  hasWebhookSecret: boolean;
  hasMockInline: boolean;
};

export function evaluateWebhookSecurity(
  input: EvaluateWebhookSecurityInput
): WebhookSecurityDecision {
  if (input.hasMockInline) {
    return { mode: "bypass_mock_inline" };
  }

  if (!input.hasCredentials) {
    return { mode: "skip_signature_in_mock_mode" };
  }

  if (!input.hasWebhookSecret) {
    return { mode: "reject_missing_secret" };
  }

  return { mode: "verify_signature" };
}
