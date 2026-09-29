import type { ManualPaymentMethodType } from "@/lib/types";

export const MANUAL_PAYMENT_METHODS: ManualPaymentMethodType[] = [
  "nequi",
  "bancolombia_qr",
  "bancolombia_transfer"
];

export function getManualPaymentLabel(method: ManualPaymentMethodType): string {
  switch (method) {
    case "nequi":
      return "Nequi";
    case "bancolombia_qr":
      return "Bancolombia QR";
    case "bancolombia_transfer":
      return "Transferencia Bancolombia";
    default:
      return "Pago manual";
  }
}

export function getManualPaymentShortDescription(
  method: ManualPaymentMethodType
): string {
  switch (method) {
    case "nequi":
      return "Paga al número o QR del creador y sube tu comprobante.";
    case "bancolombia_qr":
      return "Escanea el QR Bancolombia del creador y adjunta el comprobante.";
    case "bancolombia_transfer":
      return "Transfiere a la cuenta Bancolombia del creador y adjunta el comprobante.";
    default:
      return "Paga directamente al creador y sube tu comprobante.";
  }
}

export function getManualPaymentNotificationLabel(
  method: ManualPaymentMethodType
): string {
  switch (method) {
    case "nequi":
      return "pago por Nequi";
    case "bancolombia_qr":
      return "pago por Bancolombia QR";
    case "bancolombia_transfer":
      return "transferencia Bancolombia";
    default:
      return "pago manual";
  }
}
