"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Eye,
  ShieldCheck,
  UserRound
} from "lucide-react";
import type { NequiPayment } from "@/lib/types";

type Props = {
  rifaId: string;
  rifaTitle: string;
  payments: NequiPayment[];
  creatorUserId: string;
};

const STATUS_VARIANT: Record<string, string> = {
  pending: "!bg-amber-500 !text-white !border-0",
  approved: "!bg-emerald-500 !text-white !border-0",
  rejected: "!bg-rose-500 !text-white !border-0"
};

function statusBadge(s: string) {
  const map: Record<string, { i: any; label: string }> = {
    pending: { i: Clock, label: "Pendiente" },
    approved: { i: CheckCircle2, label: "Aprobado" },
    rejected: { i: XCircle, label: "Rechazado" }
  };
  const cfg = map[s] ?? map.pending;
  const Icon = cfg.i;
  return (
    <Badge className={`text-[11px] ${STATUS_VARIANT[s] ?? ""}`}>
      <Icon className="mr-1 h-3 w-3" /> {cfg.label}
    </Badge>
  );
}

export default function VoucherReviewList({
  rifaId,
  rifaTitle,
  payments,
  creatorUserId
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const totalPending = payments.filter((p) => p.status === "pending").length;
  const totalApproved = payments.filter((p) => p.status === "approved").length;
  const totalRejected = payments.filter((p) => p.status === "rejected").length;
  const montoPendiente = payments
    .filter((p) => p.status === "pending")
    .reduce((a, p) => a + Number(p.amount || 0), 0);

  async function review(id: string, newStatus: "approved" | "rejected") {
    try {
      setLoading((l) => ({ ...l, [id]: true }));
      setMsg("");
      const res = await fetch(`/api/nequi-payments/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: (notes[id] || "").trim().slice(0, 500)
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setMsg(
        newStatus === "approved"
          ? "Pago aprobado y reservas marcadas como pagadas."
          : "Pago marcado como rechazado."
      );
      router.refresh();
    } catch (err: any) {
      setMsg("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoading((l) => ({ ...l, [id]: false }));
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-brand-rose text-white">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-lg">
                  Comprobantes Nequi · {rifaTitle}
                </CardTitle>
                <CardDescription className="text-sm">
                  Valida manualmente los comprobantes que envían los participantes.
                  Cuando apruebas, sus reservas quedan marcadas como pagadas.
                </CardDescription>
              </div>
            </div>
            <Badge className="!bg-cyan-600 !text-white !border-0">
              <ShieldCheck className="mr-1 h-3 w-3" /> {payments.length} en total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              {
                label: "Pendientes",
                count: totalPending,
                amt: montoPendiente,
                color: "from-amber-500 to-orange-500",
                ic: Clock
              },
              {
                label: "Aprobados",
                count: totalApproved,
                amt: payments
                  .filter((p) => p.status === "approved")
                  .reduce((a, p) => a + Number(p.amount || 0), 0),
                color: "from-emerald-500 to-green-600",
                ic: CheckCircle2
              },
              {
                label: "Rechazados",
                count: totalRejected,
                amt: 0,
                color: "from-rose-500 to-pink-600",
                ic: XCircle
              },
              {
                label: "Total revisado",
                count: totalApproved + totalRejected,
                amt: payments
                  .filter((p) => p.status !== "pending")
                  .reduce((a, p) => a + Number(p.amount || 0), 0),
                color: "from-brand-violet to-brand-rose",
                ic: DollarSign
              }
            ].map((c) => {
              const Ic = c.ic;
              return (
                <div
                  key={c.label}
                  className={`rounded-xl p-3.5 bg-gradient-to-br ${c.color} text-white shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide opacity-90">
                      {c.label}
                    </span>
                    <Ic className="h-3.5 w-3.5 opacity-90" />
                  </div>
                  <div className="mt-1.5 font-numbers text-2xl font-black tabular-nums">
                    {c.count}
                  </div>
                  {c.amt > 0 ? (
                    <div className="mt-0.5 text-xs font-semibold opacity-90">
                      ${c.amt.toLocaleString("es-CO")}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {msg ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {msg}
        </div>
      ) : null}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-3 w-full grid grid-cols-3">
          <TabsTrigger value="pending">Pendientes ({totalPending})</TabsTrigger>
          <TabsTrigger value="approved">Aprobados ({totalApproved})</TabsTrigger>
          <TabsTrigger value="rejected">Rechazados ({totalRejected})</TabsTrigger>
        </TabsList>
        {(["pending", "approved", "rejected"] as const).map((tab) => {
          const rows = payments.filter((p) => p.status === tab);
          return (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  No hay comprobantes en este estado.
                </div>
              ) : (
                rows.map((p) => (
                  <Card
                    key={p.id}
                    className={`shadow-sm ${
                      p.status === "pending"
                        ? "border-amber-200 bg-amber-50/30"
                        : p.status === "approved"
                          ? "border-emerald-200 bg-emerald-50/30"
                          : "border-rose-200 bg-rose-50/30"
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        {/* Imagen comprobante */}
                        <div className="shrink-0 lg:w-60">
                          <a
                            href={p.voucher_image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
                          >
                            <img
                              src={p.voucher_image_url}
                              alt="comprobante"
                              className="h-48 w-full object-cover"
                            />
                            <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                              <Eye className="h-3 w-3" /> Abrir en tamaño completo
                            </div>
                          </a>
                        </div>

                        {/* Datos y acciones */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                  <UserRound className="h-3.5 w-3.5" />
                                  <span className="truncate max-w-[240px]">
                                    {p.user?.full_name ?? `User ${p.user_id.slice(0, 8)}`}
                                  </span>
                                </div>
                                {statusBadge(p.status)}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(p.created_at).toLocaleString("es-CO")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Monto
                              </div>
                              <div className="font-numbers text-2xl font-black tabular-nums text-slate-900">
                                ${Number(p.amount || 0).toLocaleString("es-CO")}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {(p.numbers || []).map((n) => (
                              <span
                                key={n}
                                className="inline-flex min-w-[2.1rem] justify-center rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-black text-white"
                              >
                                #{n}
                              </span>
                            ))}
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 text-xs">
                            <div className="rounded-lg bg-white/70 border border-slate-200 p-2.5">
                              <div className="font-bold text-slate-600 uppercase tracking-wide text-[10px]">
                                Números de referencia
                              </div>
                              <div className="mt-1 space-y-0.5 text-slate-700">
                                {p.payer_phone ? (
                                  <div className="truncate">
                                    <span className="font-semibold">Desde:</span>{" "}
                                    {p.payer_phone}
                                  </div>
                                ) : null}
                                {p.voucher_reference ? (
                                  <div className="truncate">
                                    <span className="font-semibold">Ref:</span>{" "}
                                    {p.voucher_reference}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div className="rounded-lg bg-white/70 border border-slate-200 p-2.5">
                              <div className="font-bold text-slate-600 uppercase tracking-wide text-[10px]">
                                Revisión
                              </div>
                              <div className="mt-1 text-slate-700 space-y-0.5">
                                {p.reviewed_at ? (
                                  <>
                                    <div>
                                      <span className="font-semibold">Fecha:</span>{" "}
                                      {new Date(p.reviewed_at).toLocaleString("es-CO")}
                                    </div>
                                    {p.review_notes ? (
                                      <div className="truncate">
                                        <span className="font-semibold">Nota:</span>{" "}
                                        {p.review_notes}
                                      </div>
                                    ) : null}
                                  </>
                                ) : (
                                  <div className="text-slate-500 italic">
                                    Pendiente por validar
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {p.status === "pending" ? (
                            <div className="space-y-2 border-t border-slate-200/70 pt-3">
                              <div>
                                <Label className="text-[11px] font-bold text-slate-600">
                                  Nota para el participante (opcional)
                                </Label>
                                <Input
                                  value={notes[p.id] || ""}
                                  onChange={(e) =>
                                    setNotes((n) => ({ ...n, [p.id]: e.target.value }))
                                  }
                                  placeholder="Ej: comprobante OK / monto no coincide"
                                  className="mt-1 h-9 text-xs"
                                />
                              </div>
                              <div className="flex gap-2 justify-end flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 !border-rose-200 !text-rose-700 hover:!bg-rose-50"
                                  disabled={loading[p.id]}
                                  onClick={() => review(p.id, "rejected")}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  {loading[p.id] ? "Procesando..." : "Rechazar"}
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-9 !bg-gradient-to-r from-emerald-500 to-green-600 !text-white font-bold"
                                  disabled={loading[p.id]}
                                  onClick={() => review(p.id, "approved")}
                                >
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                  {loading[p.id] ? "Aprobando..." : "Aprobar y marcar como pagado"}
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
