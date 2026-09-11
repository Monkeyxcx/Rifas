"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  QrCode,
  Upload,
  Copy,
  CheckCircle2,
  Info,
  ShieldCheck,
  FileImage
} from "lucide-react";

type Props = {
  rifaId: string;
  rifaTitle: string;
  numbers: string[];
  reservaIds: string[];
  amount: number;
  unitPrice: number;
  // Datos del creador (de la rifa o verificación aprobada)
  creatorNequiPhone: string | null;
  creatorNequiQrUrl: string | null;
  creatorName: string | null;
  participantUserId: string;
};

export default function NequiCheckoutPane(props: Props) {
  const {
    rifaId,
    rifaTitle,
    numbers,
    reservaIds,
    amount,
    unitPrice,
    creatorNequiPhone,
    creatorNequiQrUrl,
    creatorName,
    participantUserId
  } = props;
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  const [voucherUrl, setVoucherUrl] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [reference, setReference] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setLoading(true);
      const ext = f.name.split(".").pop()?.toLowerCase().slice(0, 5) || "jpg";
      const path = `nequi-vouchers/${rifaId}/${participantUserId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("rifas-media")
        .upload(path, f, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("rifas-media").getPublicUrl(path);
      setVoucherUrl(data?.publicUrl || "");
      setMsg("Comprobante cargado. Presiona Enviar comprobante.");
    } catch (err: any) {
      setMsg("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!voucherUrl) {
      setMsg("Por favor sube la foto del comprobante de pago.");
      return;
    }
    try {
      setLoading(true);
      setMsg("");
      const payload = {
        rifa_id: rifaId,
        user_id: participantUserId,
        reserva_ids: reservaIds,
        numbers,
        amount: Number(amount.toFixed(2)),
        voucher_image_url: voucherUrl,
        voucher_reference: reference.trim().slice(0, 80) || null,
        payer_phone: payerPhone.trim().slice(0, 15) || null,
        status: "pending"
      };
      const { error } = await (supabase.from("nequi_payments") as any).insert(payload);
      if (error) throw error;
      setDone(true);
      setMsg(
        "¡Comprobante enviado! El creador de la rifa lo revisará en breve. Cuando lo apruebe tus números quedarán confirmados como pagados."
      );
      setTimeout(() => router.refresh(), 1200);
    } catch (err: any) {
      setMsg("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copiado al portapapeles.");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setMsg(text);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-slate-50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  Pago directo por Nequi
                  <Badge className="!bg-emerald-500 !text-white !border-0 text-[10px]">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Validación manual
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">
                  Escanea el QR o envía al número del creador y pega el comprobante de la
                  transferencia.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            {/* Datos pago */}
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Pagarás
                </div>
                <div className="text-3xl font-black tabular-nums tracking-tight text-slate-900">
                  ${amount.toLocaleString("es-CO")}
                </div>
                <div className="text-xs text-slate-500">
                  {numbers.length} números × ${unitPrice.toLocaleString("es-CO")}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {numbers.map((n) => (
                    <span
                      key={n}
                      className="inline-flex min-w-[2.25rem] justify-center rounded-md bg-gradient-to-br from-brand-rose to-brand-violet px-2 py-1 text-xs font-black text-white"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-slate-500 truncate">
                  <span className="font-semibold">Rifa:</span> {rifaTitle}
                </div>
              </div>

              <div className="rounded-xl border border-cyan-200 bg-white p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                  Datos del creador {creatorName ? `· ${creatorName}` : ""}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-600">
                    Número Nequi
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-lg font-black text-slate-900 tabular-nums">
                      {creatorNequiPhone ?? "—"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => copy(creatorNequiPhone ?? "")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </Button>
                  </div>
                </div>

                {creatorNequiQrUrl ? (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <QrCode className="h-3.5 w-3.5" /> Escanea el QR
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2 inline-block">
                      <img
                        src={creatorNequiQrUrl}
                        alt="QR Nequi"
                        className="h-40 w-40 object-contain"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Sube comprobante */}
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                  <FileImage className="h-3.5 w-3.5" /> Adjunta el comprobante
                </div>

                <div>
                  <Label htmlFor="voucher" className="text-xs font-bold">
                    Foto del comprobante *
                  </Label>
                  <Input
                    id="voucher"
                    type="file"
                    accept="image/*"
                    disabled={loading || done}
                    className="h-auto pt-2 pb-6 text-xs mt-1"
                    onChange={handleUpload}
                  />
                  {voucherUrl ? (
                    <div className="mt-2 overflow-hidden rounded-lg border border-emerald-200">
                      <img
                        src={voucherUrl}
                        alt="comprobante"
                        className="h-56 w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="payer" className="text-xs font-bold">
                      Tu número (opcional)
                    </Label>
                    <Input
                      id="payer"
                      inputMode="numeric"
                      placeholder="Desde qué número pagaste"
                      value={payerPhone}
                      disabled={loading || done}
                      onChange={(e) => setPayerPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ref" className="text-xs font-bold">
                      Referencia / código Nequi
                    </Label>
                    <Input
                      id="ref"
                      placeholder="Ej: 123456"
                      value={reference}
                      disabled={loading || done}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </div>

                {msg ? (
                  <div
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {done ? <CheckCircle2 className="mr-1 inline h-4 w-4" /> : null}
                    {msg}
                  </div>
                ) : null}

                <div className="rounded-lg border border-dashed border-cyan-200 bg-cyan-50/50 p-3 text-[11px] text-cyan-800">
                  <Info className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5" />
                  Tu reserva sigue reservada por 15 minutos mientras te llega la
                  aprobación. Si el creador no lo aprueba a tiempo, podrás volver a
                  intentarlo.
                </div>

                <Button
                  onClick={submit}
                  disabled={loading || done || !voucherUrl}
                  className="w-full h-11 !bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 !text-white font-black"
                >
                  <Upload className="mr-1.5 h-4.5 w-4.5" />
                  {done ? "Comprobante enviado ✔" : loading ? "Enviando..." : "Enviar comprobante"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
