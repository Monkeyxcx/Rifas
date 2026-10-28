"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserNequiVerification } from "@/lib/types";
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
  Upload,
  Phone,
  IdCard,
  FileText,
  QrCode,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
  Info
} from "lucide-react";

const BUCKET = "rifas-media";
const ACCEPT = "image/*,.pdf";

type Props = {
  userId: string;
  latest?: UserNequiVerification | null;
};

function statusBadge(status?: string) {
  if (status === "approved")
    return (
      <Badge className="!bg-emerald-500 !text-white !border-0 text-xs">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Verificación aprobada
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge className="!bg-rose-500 !text-white !border-0 text-xs">
        <XCircle className="mr-1 h-3 w-3" />
        Verificación rechazada
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge className="!bg-amber-500 !text-white !border-0 text-xs">
        <Clock className="mr-1 h-3 w-3" />
        En revisión por un administrador
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs">
      <Info className="mr-1 h-3 w-3" />
      Aún no tienes verificación
    </Badge>
  );
}

export default function NequiVerificationForm({ userId, latest }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [nequiPhone, setNequiPhone] = useState(latest?.nequi_phone ?? "");
  const [accountHolderName, setAccountHolderName] = useState(
    latest?.account_holder_name ?? ""
  );
  const [documentType, setDocumentType] = useState(latest?.document_type ?? "CC");
  const [documentNumber, setDocumentNumber] = useState(latest?.document_number ?? "");
  const [docUrl, setDocUrl] = useState(latest?.document_image_url ?? "");
  const [certUrl, setCertUrl] = useState(latest?.nequi_certificate_url ?? "");
  const [qrUrl, setQrUrl] = useState(latest?.nequi_qr_url ?? "");
  const [bancolombiaQrUrl, setBancolombiaQrUrl] = useState(
    latest?.bancolombia_qr_url ?? ""
  );
  const [bancolombiaAccountLabel, setBancolombiaAccountLabel] = useState(
    latest?.bancolombia_account_label ?? ""
  );

  const locked = latest?.status === "approved" || latest?.status === "pending";

  async function uploadFile(file: File, category: string): Promise<string> {
    if (!file || !file.size) throw new Error("archivo vacío");
    const ext =
      file.name.split(".").pop()?.toLowerCase().slice(0, 5) || "jpg";
    const path = `${userId}/${category}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true
    });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("no public URL");
    return data.publicUrl;
  }

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (s: string) => void,
    category: string
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setLoading(true);
      const url = await uploadFile(f, category);
      setter(url);
      setMsg("Archivo subido correctamente.");
    } catch (err: any) {
      setMsg("Error subiendo archivo: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    const hasNequiData = Boolean(nequiPhone.trim() || qrUrl.trim());
    const hasBancolombiaData = Boolean(
      bancolombiaQrUrl.trim() || bancolombiaAccountLabel.trim()
    );
    if (
      !accountHolderName.trim() ||
      !documentNumber.trim() ||
      !docUrl ||
      !certUrl ||
      (!hasNequiData && !hasBancolombiaData)
    ) {
      setMsg(
        "Debes completar titular, documento, foto del documento, soporte bancario y al menos un método de cobro manual."
      );
      return;
    }
    try {
      setLoading(true);
      setMsg("");
      const payload = {
        user_id: userId,
        nequi_phone: nequiPhone.trim().slice(0, 15),
        account_holder_name: accountHolderName.trim().slice(0, 120),
        document_type: documentType.trim().slice(0, 10),
        document_number: documentNumber.trim().slice(0, 30),
        document_image_url: docUrl,
        nequi_certificate_url: certUrl,
        nequi_qr_url: qrUrl || null,
        bancolombia_qr_url: bancolombiaQrUrl || null,
        bancolombia_account_label: bancolombiaAccountLabel.trim().slice(0, 160) || null,
        status: "pending"
      };
      const { error } = await (supabase
        .from("user_nequi_verifications") as any)
        .insert(payload);
      if (error) throw error;
      setMsg("Solicitud enviada. Un administrador la revisará.");
      router.refresh();
    } catch (err: any) {
      setMsg("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-rose-50/40 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-brand-rose text-white">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-lg">
                  Cobros manuales del creador
                </CardTitle>
                <CardDescription className="text-sm">
                  Configura Nequi o Bancolombia para recibir pagos directos de tus
                  participantes. Un administrador valida tu identidad y tus soportes antes
                  de habilitar estos cobros en tus rifas.
                </CardDescription>
              </div>
            </div>
            {statusBadge(latest?.status)}
          </div>
          {latest?.review_notes && (
            <div className="mt-3 rounded-lg border border-dashed border-rose-300 bg-rose-50/60 p-3 text-xs text-rose-800">
              <ShieldAlert className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5" />
              Nota admin: {latest.review_notes}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-holder">Titular de la cuenta *</Label>
                <Input
                  id="account-holder"
                  placeholder="Ej: Juan Perez"
                  value={accountHolderName}
                  disabled={locked}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nequi-phone">Número Nequi (opcional)</Label>
                <Input
                  id="nequi-phone"
                  inputMode="numeric"
                  placeholder="300 123 4567"
                  value={nequiPhone}
                  disabled={locked}
                  onChange={(e) => setNequiPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bancolombia-account">
                  Cuenta o alias Bancolombia (opcional)
                </Label>
                <Input
                  id="bancolombia-account"
                  placeholder="Ej: Ahorros Bancolombia 1234"
                  value={bancolombiaAccountLabel}
                  disabled={locked}
                  onChange={(e) => setBancolombiaAccountLabel(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="doc-type">Tipo doc *</Label>
                  <select
                    id="doc-type"
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm disabled:opacity-60"
                    disabled={locked}
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="TI">TI</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="doc-num">Número documento *</Label>
                  <Input
                    id="doc-num"
                    placeholder="123456789"
                    value={documentNumber}
                    disabled={locked}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  id: "doc-img",
                  label: "Foto documento (ambos lados) *",
                  hint: "Foto legible de tu CC/CE/NIT asociado a Nequi",
                  icon: IdCard,
                  url: docUrl,
                  set: setDocUrl,
                  category: "document"
                },
                {
                  id: "cert-img",
                  label: "Certificado o soporte bancario principal *",
                  hint: "Puede ser certificado Nequi o Bancolombia del titular que recibirá el dinero",
                  icon: FileText,
                  url: certUrl,
                  set: setCertUrl,
                  category: "certificado"
                },
                {
                  id: "qr-img",
                  label: "QR Nequi (opcional)",
                  hint: "Captura QR Nequi para que participantes escaneen rápido",
                  icon: QrCode,
                  url: qrUrl,
                  set: setQrUrl,
                  category: "qr-nequi"
                },
                {
                  id: "bco-qr-img",
                  label: "QR Bancolombia (opcional)",
                  hint: "Captura QR Bancolombia para pagos directos del participante",
                  icon: Building2,
                  url: bancolombiaQrUrl,
                  set: setBancolombiaQrUrl,
                  category: "qr-bancolombia"
                }
              ].map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label htmlFor={f.id} className="flex items-center gap-1.5 text-xs font-bold">
                    <f.icon className="h-3.5 w-3.5" /> {f.label}
                  </Label>
                  <div className="relative">
                    <Input
                      id={f.id}
                      type="file"
                      accept={ACCEPT}
                      disabled={locked || loading}
                      onChange={(e) => handleUpload(e, f.set, f.category)}
                      className="h-auto pt-2 pb-6 px-3 text-xs"
                    />
                    {f.url ? (
                      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                        <img
                          src={f.url}
                          alt={f.label}
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-500">{f.hint}</p>
                </div>
              ))}
            </div>

            {msg ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                {msg}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-slate-500">
                ⚠️ Una vez enviada la solicitud no podrás editarla hasta que el admin responda. Debes dejar al menos un método manual listo: Nequi o Bancolombia.
              </p>
              <Button
                type="submit"
                disabled={locked || loading}
                className="!bg-gradient-to-r from-cyan-500 to-brand-rose !text-white font-bold"
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {loading ? "Enviando..." : "Enviar verificación"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
