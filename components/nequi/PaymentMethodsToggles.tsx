"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RifaPaymentMethods, UserNequiVerification } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  CheckCircle2,
  Landmark,
  Phone,
  QrCode,
  WalletCards,
  XCircle
} from "lucide-react";

type Props = {
  rifaId: string;
  manualVerified: boolean;
  defaultMethods?: RifaPaymentMethods | null;
  latestVerification?: UserNequiVerification | null;
};

export default function PaymentMethodsToggles({
  rifaId,
  manualVerified,
  defaultMethods,
  latestVerification
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [acceptNequi, setAcceptNequi] = useState(
    defaultMethods?.accept_nequi ?? false
  );
  const [acceptBancolombiaQr, setAcceptBancolombiaQr] = useState(
    defaultMethods?.accept_bancolombia_qr ?? false
  );
  const [acceptBancolombiaTransfer, setAcceptBancolombiaTransfer] = useState(
    defaultMethods?.accept_bancolombia_transfer ?? false
  );
  const [phoneOverride, setPhoneOverride] = useState(
    defaultMethods?.nequi_phone_override ?? ""
  );
  const [qrOverride, setQrOverride] = useState(
    defaultMethods?.nequi_qr_override_url ?? ""
  );
  const [bancolombiaQrOverride, setBancolombiaQrOverride] = useState(
    defaultMethods?.bancolombia_qr_override_url ?? ""
  );
  const [bancolombiaAccountOverride, setBancolombiaAccountOverride] = useState(
    defaultMethods?.bancolombia_account_override ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    if (!acceptNequi && !acceptBancolombiaQr && !acceptBancolombiaTransfer) {
      setMsg("Debes habilitar al menos un método manual de cobro.");
      return;
    }
    if (!manualVerified) {
      setMsg("Tu cuenta aún no está aprobada para cobros manuales.");
      return;
    }
    const hasNequiData =
      Boolean(phoneOverride.trim()) ||
      Boolean(qrOverride.trim()) ||
      Boolean(latestVerification?.nequi_phone?.trim()) ||
      Boolean(latestVerification?.nequi_qr_url?.trim());
    const hasBancolombiaQrData =
      Boolean(bancolombiaQrOverride.trim()) ||
      Boolean(latestVerification?.bancolombia_qr_url?.trim()) ||
      Boolean(bancolombiaAccountOverride.trim()) ||
      Boolean(latestVerification?.bancolombia_account_label?.trim());
    const hasBancolombiaTransferData =
      Boolean(bancolombiaAccountOverride.trim()) ||
      Boolean(latestVerification?.bancolombia_account_label?.trim());

    if (acceptNequi && !hasNequiData) {
      setMsg("Para activar Nequi debes tener un número o QR guardado en tu verificación.");
      return;
    }
    if (acceptBancolombiaQr && !hasBancolombiaQrData) {
      setMsg("Para activar Bancolombia QR debes tener un QR o una referencia bancaria visible.");
      return;
    }
    if (acceptBancolombiaTransfer && !hasBancolombiaTransferData) {
      setMsg("Para activar transferencia Bancolombia debes indicar la cuenta o alias visible.");
      return;
    }
    try {
      setLoading(true);
      setMsg("");
      const payload: Partial<RifaPaymentMethods> = {
        rifa_id: rifaId,
        accept_mercado_pago: false,
        accept_nequi: acceptNequi,
        accept_bancolombia_qr: acceptBancolombiaQr,
        accept_bancolombia_transfer: acceptBancolombiaTransfer,
        nequi_phone_override: phoneOverride.trim() || null,
        nequi_qr_override_url: qrOverride.trim() || null,
        bancolombia_qr_override_url: bancolombiaQrOverride.trim() || null,
        bancolombia_account_override: bancolombiaAccountOverride.trim() || null
      };
      const { error } = await (supabase
        .from("rifa_payment_methods") as any)
        .upsert(payload, { onConflict: "rifa_id" });
      if (error) throw error;
      setMsg("Métodos de pago guardados.");
      router.refresh();
    } catch (err: any) {
      setMsg("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function uploadQr(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void,
    prefix: string
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setLoading(true);
      const ext = f.name.split(".").pop()?.toLowerCase().slice(0, 5) || "png";
      const path = `${prefix}/${rifaId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("rifas-media")
        .upload(path, f, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage
        .from("rifas-media")
        .getPublicUrl(path);
      setter(data?.publicUrl || "");
      setMsg("Archivo cargado. Presiona Guardar para asociarlo a la rifa.");
    } catch (err: any) {
      setMsg("Error subiendo archivo: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-rose to-brand-cyan text-white">
            <WalletCards className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="font-display text-lg">
              Métodos manuales de cobro
            </CardTitle>
            <CardDescription>
              El dinero de la rifa lo recibes tú directamente por Nequi o Bancolombia.
              Activa los métodos que quieras ofrecer a tus participantes.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label
            htmlFor="accept-nequi"
            className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${
              acceptNequi
                ? "border-cyan-400 bg-cyan-50/60"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              id="accept-nequi"
              type="checkbox"
              className="mt-0.5 h-5 w-5 accent-cyan-500"
              disabled={!manualVerified}
              checked={acceptNequi}
              onChange={(e) => setAcceptNequi(e.target.checked)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-cyan-600" /> Nequi
                </div>
                {manualVerified ? (
                  <Badge className="!bg-emerald-500 !text-white !border-0 text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Verificación OK
                  </Badge>
                ) : (
                  <Badge className="!bg-slate-400 !text-white !border-0 text-[10px]">
                    <XCircle className="mr-1 h-3 w-3" /> Sin aprobación
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Los participantes te envían el dinero a tu número o QR de Nequi y tú
                validas el comprobante.
                {!manualVerified
                  ? " Primero aprueba tus cobros manuales en tu perfil."
                  : ""}
              </p>
            </div>
          </label>

          <label
            htmlFor="accept-bancolombia-qr"
            className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${
              acceptBancolombiaQr
                ? "border-brand-violet bg-violet-50/60"
                : "border-slate-200 bg-white hover:border-slate-300"
            } ${!manualVerified ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              id="accept-bancolombia-qr"
              type="checkbox"
              className="mt-0.5 h-5 w-5 accent-brand-violet"
              disabled={!manualVerified}
              checked={acceptBancolombiaQr}
              onChange={(e) => setAcceptBancolombiaQr(e.target.checked)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-brand-violet" /> Bancolombia QR
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Los participantes escanean tu QR Bancolombia y luego suben el comprobante.
              </p>
            </div>
          </label>

          <label
            htmlFor="accept-bancolombia-transfer"
            className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${
              acceptBancolombiaTransfer
                ? "border-emerald-400 bg-emerald-50/60"
                : "border-slate-200 bg-white hover:border-slate-300"
            } ${!manualVerified ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <input
              id="accept-bancolombia-transfer"
              type="checkbox"
              className="mt-0.5 h-5 w-5 accent-emerald-600"
              disabled={!manualVerified}
              checked={acceptBancolombiaTransfer}
              onChange={(e) => setAcceptBancolombiaTransfer(e.target.checked)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Landmark className="h-4 w-4 text-emerald-600" /> Transferencia Bancolombia
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Los participantes transfieren a tu cuenta Bancolombia y luego adjuntan el comprobante.
              </p>
            </div>
          </label>
        </div>

        {(acceptNequi || acceptBancolombiaQr || acceptBancolombiaTransfer) && manualVerified ? (
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {acceptNequi ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="np-over">
                      Número Nequi (opcional · sobrescribe tu verificación)
                    </Label>
                    <Input
                      id="np-over"
                      inputMode="numeric"
                      placeholder="Deja vacío para usar tu número verificado"
                      value={phoneOverride}
                      onChange={(e) => setPhoneOverride(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="np-qr">
                      QR Nequi (opcional · sobrescribe tu verificación)
                    </Label>
                    <Input
                      id="np-qr"
                      type="file"
                      accept="image/*"
                      className="h-auto pt-2 pb-6 text-xs"
                      onChange={(e) => uploadQr(e, setQrOverride, "rifa-qr/nequi")}
                    />
                    {qrOverride ? (
                      <img
                        src={qrOverride}
                        alt="QR Nequi"
                        className="h-24 rounded-lg border border-slate-200 bg-white object-contain p-1"
                      />
                    ) : latestVerification?.nequi_qr_url ? (
                      <img
                        src={latestVerification.nequi_qr_url}
                        alt="QR Nequi"
                        className="h-24 rounded-lg border border-slate-200 bg-white object-contain p-1"
                      />
                    ) : null}
                  </div>
                </>
              ) : null}

              {acceptBancolombiaQr ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bco-qr-over">
                      QR Bancolombia (opcional · sobrescribe tu verificación)
                    </Label>
                    <Input
                      id="bco-qr-over"
                      type="file"
                      accept="image/*"
                      className="h-auto pt-2 pb-6 text-xs"
                      onChange={(e) =>
                        uploadQr(e, setBancolombiaQrOverride, "rifa-qr/bancolombia")
                      }
                    />
                    {bancolombiaQrOverride ? (
                      <img
                        src={bancolombiaQrOverride}
                        alt="QR Bancolombia"
                        className="h-24 rounded-lg border border-slate-200 bg-white object-contain p-1"
                      />
                    ) : latestVerification?.bancolombia_qr_url ? (
                      <img
                        src={latestVerification.bancolombia_qr_url}
                        alt="QR Bancolombia"
                        className="h-24 rounded-lg border border-slate-200 bg-white object-contain p-1"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bco-account-over">
                      Referencia visible Bancolombia
                    </Label>
                    <Input
                      id="bco-account-over"
                      placeholder="Ej: Ahorros Bancolombia 1234"
                      value={bancolombiaAccountOverride}
                      onChange={(e) => setBancolombiaAccountOverride(e.target.value)}
                    />
                  </div>
                </>
              ) : null}

              {acceptBancolombiaTransfer && !acceptBancolombiaQr ? (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bco-transfer-over">
                    Cuenta o alias visible de Bancolombia
                  </Label>
                  <Input
                    id="bco-transfer-over"
                    placeholder="Ej: Ahorros Bancolombia 1234 / Titular Juan Perez"
                    value={bancolombiaAccountOverride}
                    onChange={(e) => setBancolombiaAccountOverride(e.target.value)}
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              Si no llenas estos campos, la rifa usará los datos aprobados en tu perfil. El
              participante verá solo la información necesaria para pagarte.
            </div>
          </div>
        ) : null}

        {msg ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            {msg}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={loading}
            className="!bg-gradient-to-r from-brand-rose to-brand-violet !text-white font-bold"
          >
            {loading ? "Guardando..." : "Guardar métodos de pago"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
