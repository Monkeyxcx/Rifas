"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RifaPaymentMethods } from "@/lib/types";
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
import { CreditCard, Phone, CheckCircle2, XCircle } from "lucide-react";

type Props = {
  rifaId: string;
  nequiVerified: boolean;
  defaultMethods?: RifaPaymentMethods | null;
};

export default function PaymentMethodsToggles({
  rifaId,
  nequiVerified,
  defaultMethods
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [acceptMP, setAcceptMP] = useState(
    defaultMethods?.accept_mercado_pago ?? true
  );
  const [acceptNequi, setAcceptNequi] = useState(
    defaultMethods?.accept_nequi ?? false
  );
  const [phoneOverride, setPhoneOverride] = useState(
    defaultMethods?.nequi_phone_override ?? ""
  );
  const [qrOverride, setQrOverride] = useState(
    defaultMethods?.nequi_qr_override_url ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    if (!acceptMP && !acceptNequi) {
      setMsg("Debes habilitar al menos un método de pago.");
      return;
    }
    if (acceptNequi && !nequiVerified) {
      setMsg("Tu cuenta aún no está verificada para cobrar por Nequi.");
      return;
    }
    try {
      setLoading(true);
      setMsg("");
      const payload: Partial<RifaPaymentMethods> = {
        rifa_id: rifaId,
        accept_mercado_pago: acceptMP,
        accept_nequi: acceptNequi,
        nequi_phone_override: phoneOverride.trim() || null,
        nequi_qr_override_url: qrOverride.trim() || null
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

  async function uploadQr(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setLoading(true);
      const ext = f.name.split(".").pop()?.toLowerCase().slice(0, 5) || "png";
      const path = `rifa-qr/${rifaId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("rifas-media")
        .upload(path, f, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage
        .from("rifas-media")
        .getPublicUrl(path);
      setQrOverride(data?.publicUrl || "");
      setMsg("QR cargado. Presiona Guardar para asociarlo a la rifa.");
    } catch (err: any) {
      setMsg("Error subiendo QR: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-rose to-brand-cyan text-white">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="font-display text-lg">
              Métodos de pago aceptados
            </CardTitle>
            <CardDescription>
              Elige cómo quieren pagarte los participantes de esta rifa.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label
            htmlFor="accept-mp"
            className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${
              acceptMP
                ? "border-emerald-400 bg-emerald-50/60"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              id="accept-mp"
              type="checkbox"
              className="mt-0.5 h-5 w-5 accent-brand-rose"
              checked={acceptMP}
              onChange={(e) => setAcceptMP(e.target.checked)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-bold text-slate-900">Mercado Pago</div>
                <Badge className="!bg-emerald-500 !text-white !border-0 text-[10px]">
                  Recomendado
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tarjetas, transferencias, dinero en cuenta MP. Pagos automáticos 100%
                online.
              </p>
            </div>
          </label>

          <label
            htmlFor="accept-nequi"
            className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${
              acceptNequi
                ? "border-cyan-400 bg-cyan-50/60"
                : nequiVerified
                  ? "border-slate-200 bg-white hover:border-slate-300"
                  : "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
            }`}
          >
            <input
              id="accept-nequi"
              type="checkbox"
              className="mt-0.5 h-5 w-5 accent-cyan-500"
              disabled={!nequiVerified}
              checked={acceptNequi}
              onChange={(e) => setAcceptNequi(e.target.checked)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-cyan-600" /> Pago por Nequi
                </div>
                {nequiVerified ? (
                  <Badge className="!bg-emerald-500 !text-white !border-0 text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Verificación OK
                  </Badge>
                ) : (
                  <Badge className="!bg-slate-400 !text-white !border-0 text-[10px]">
                    <XCircle className="mr-1 h-3 w-3" /> Sin verificación
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Los participantes te envían el dinero directamente y tú validas el
                comprobante.
                {!nequiVerified
                  ? " Primero envía tu verificación Nequi en tu perfil."
                  : ""}
              </p>
            </div>
          </label>
        </div>

        {acceptNequi && nequiVerified ? (
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
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
                  onChange={uploadQr}
                />
                {qrOverride ? (
                  <img
                    src={qrOverride}
                    alt="QR"
                    className="h-24 rounded-lg border border-slate-200 bg-white object-contain p-1"
                  />
                ) : null}
              </div>
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
