"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { UserNequiVerification, Perfil } from "@/lib/types";
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
  Clock,
  Eye,
  IdCard,
  FileText,
  Phone,
  ShieldCheck,
  XCircle,
  QrCode,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

function statusBadge(s: string) {
  const map: Record<string, { i: any; label: string; cls: string }> = {
    pending: {
      i: Clock,
      label: "Pendiente",
      cls: "!bg-amber-500 !text-white !border-0"
    },
    approved: {
      i: CheckCircle2,
      label: "Aprobada",
      cls: "!bg-emerald-500 !text-white !border-0"
    },
    rejected: {
      i: XCircle,
      label: "Rechazada",
      cls: "!bg-rose-500 !text-white !border-0"
    }
  };
  const cfg = map[s] ?? map.pending;
  const Icon = cfg.i;
  return (
    <Badge className={`text-[11px] ${cfg.cls}`}>
      <Icon className="mr-1 h-3 w-3" /> {cfg.label}
    </Badge>
  );
}

type Row = UserNequiVerification & {
  user: Pick<Perfil, "id" | "full_name" | "phone" | "avatar_url"> | null;
};

export default function AdminNequiVerificationsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
          error: uErr
        } = await supabase.auth.getUser();
        if (uErr || !user) {
          redirect("/auth?redirectTo=%2Fadmin%2Fverificaciones-nequi");
          return;
        }
        const { data: prof, error: pErr } = await supabase
          .from("profiles")
          .select("id, is_admin")
          .eq("id", user.id)
          .maybeSingle();
        if (pErr || !prof || !(prof as any).is_admin) {
          setNotAdmin(true);
          setInitializing(false);
          return;
        }

        // Cargar rows join profiles (nombre avatar phone creador)
        const { data, error } = await supabase
          .from("user_nequi_verifications")
          .select(
            `*, user:profiles!user_nequi_verifications_user_id_fkey(id, full_name, phone, avatar_url)`
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        setRows((data as Row[]) || []);
      } catch (e: any) {
        setMsg("Error: " + (e?.message ?? String(e)));
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    })();
  }, []);

  async function review(id: string, status: "approved" | "rejected") {
    try {
      setLoadingId((l) => ({ ...l, [id]: true }));
      setMsg("");
      const res = await fetch(`/api/admin/nequi-verifications/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes: (notes[id] || "").trim()
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      // Actualizar localmente
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? ({
                ...r,
                status,
                reviewed_at: new Date().toISOString(),
                review_notes: (notes[id] || "").trim() || null
              } as Row)
            : r
        )
      );
      setMsg(
        status === "approved" ? "Solicitud aprobada." : "Solicitud rechazada."
      );
      setTimeout(() => setMsg(""), 3500);
    } catch (err: any) {
      setMsg("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoadingId((l) => ({ ...l, [id]: false }));
    }
  }

  if (initializing) {
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-slate-600">
        Cargando...
      </main>
    );
  }

  if (notAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso no autorizado</CardTitle>
            <CardDescription>
              Necesitas ser administrador para acceder al panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const pending = rows.filter((r) => r.status === "pending");
  const approved = rows.filter((r) => r.status === "approved");
  const rejected = rows.filter((r) => r.status === "rejected");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto max-w-7xl px-4 py-10 lg:py-12">
        <div className="mb-8 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Badge className="!bg-amber-500 !text-white !border-0 mb-3 text-xs">
              <ShieldCheck className="mr-1 h-3 w-3" /> Panel administrador
            </Badge>
            <h1 className="font-display font-black tracking-tight text-2xl lg:text-3xl text-slate-900">
              Verificaciones Nequi de creadores
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Valida manualmente los documentos, certificado bancario y QR de cada creador
              que quiera cobrar sus rifas por Nequi.
            </p>
          </div>
          <Button asChild variant="outline" className="!border-slate-200">
            <Link href="/perfil">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mi perfil
            </Link>
          </Button>
        </div>

        {/* KPI */}
        <div className="grid gap-3 sm:grid-cols-4 mb-6">
          {[
            {
              label: "Total",
              count: rows.length,
              color: "from-brand-violet to-brand-rose",
              ic: ShieldCheck
            },
            {
              label: "Pendientes",
              count: pending.length,
              color: "from-amber-500 to-orange-500",
              ic: Clock
            },
            {
              label: "Aprobadas",
              count: approved.length,
              color: "from-emerald-500 to-green-600",
              ic: CheckCircle2
            },
            {
              label: "Rechazadas",
              count: rejected.length,
              color: "from-rose-500 to-pink-600",
              ic: XCircle
            }
          ].map((c) => {
            const Ic = c.ic;
            return (
              <div
                key={c.label}
                className={`rounded-2xl p-4 bg-gradient-to-br ${c.color} text-white shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide opacity-90">
                    {c.label}
                  </span>
                  <Ic className="h-4 w-4 opacity-90" />
                </div>
                <div className="mt-1 font-numbers text-3xl font-black tabular-nums">
                  {c.count}
                </div>
              </div>
            );
          })}
        </div>

        {msg ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 mb-4">
            {msg}
          </div>
        ) : null}

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-3">
            <TabsTrigger value="pending">
              Pendientes ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprobadas ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rechazadas ({rejected.length})
            </TabsTrigger>
          </TabsList>

          {(["pending", "approved", "rejected"] as const).map((tab) => {
            const list =
              tab === "pending"
                ? pending
                : tab === "approved"
                  ? approved
                  : rejected;
            return (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {list.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                    No hay solicitudes en este estado.
                  </div>
                ) : (
                  list.map((r) => (
                    <Card
                      key={r.id}
                      className={`shadow-sm ${
                        r.status === "pending"
                          ? "border-amber-200 bg-amber-50/30"
                          : r.status === "approved"
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-rose-200 bg-rose-50/30"
                      }`}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                          {/* Miniatura documentos */}
                          <div className="shrink-0 grid grid-cols-2 gap-2 lg:w-[480px]">
                            {[
                              {
                                url: r.document_image_url,
                                label: "Documento ID",
                                ic: IdCard
                              },
                              {
                                url: r.nequi_certificate_url,
                                label: "Certificado Nequi",
                                ic: FileText
                              },
                              ...(r.nequi_qr_url
                                ? [
                                    {
                                      url: r.nequi_qr_url,
                                      label: "QR Nequi",
                                      ic: QrCode
                                    }
                                  ]
                                : [])
                            ].map((d) => {
                              const Ic = d.ic;
                              return (
                                <a
                                  key={d.label}
                                  href={d.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
                                >
                                  <img
                                    src={d.url}
                                    alt={d.label}
                                    className="h-40 w-full object-cover"
                                  />
                                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                                    <Ic className="h-3.5 w-3.5" /> {d.label}
                                    <Eye className="ml-auto h-3.5 w-3.5 text-slate-400" />
                                  </div>
                                </a>
                              );
                            })}
                          </div>

                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4 text-brand-violet" />
                                    {r.user?.full_name ||
                                      `User ${r.user_id.slice(0, 8)}`}
                                  </div>
                                  {statusBadge(r.status)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Solicutud creada el{" "}
                                  {new Date(r.created_at).toLocaleString("es-CO")}
                                  {r.reviewed_at
                                    ? ` · Revisada ${new Date(
                                        r.reviewed_at
                                      ).toLocaleDateString("es-CO")}`
                                    : ""}
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3 text-xs">
                              <div className="rounded-lg border border-slate-200 bg-white/70 p-2.5">
                                <div className="font-bold text-slate-600 uppercase tracking-wide text-[10px] flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> Número Nequi
                                </div>
                                <div className="mt-1 font-black text-slate-900 tabular-nums">
                                  {r.nequi_phone}
                                </div>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-white/70 p-2.5">
                                <div className="font-bold text-slate-600 uppercase tracking-wide text-[10px] flex items-center gap-1">
                                  <IdCard className="h-3 w-3" /> Documento
                                </div>
                                <div className="mt-1">
                                  <span className="text-[10px] text-slate-500">
                                    {r.document_type} ·{" "}
                                  </span>
                                  <span className="font-black text-slate-900 tabular-nums">
                                    {r.document_number}
                                  </span>
                                </div>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-white/70 p-2.5">
                                <div className="font-bold text-slate-600 uppercase tracking-wide text-[10px]">
                                  Datos contacto creador
                                </div>
                                <div className="mt-1 text-slate-800">
                                  {r.user?.phone ? (
                                    <div className="truncate">
                                      Celular: {r.user.phone}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {r.review_notes ? (
                              <div className="rounded-lg border border-dashed border-slate-300 bg-white/80 p-2.5 text-[11px] text-slate-700">
                                <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-brand-violet -translate-y-0.5" />
                                <span className="font-semibold">Nota revisión:</span>{" "}
                                {r.review_notes}
                              </div>
                            ) : null}

                            {r.status === "pending" ? (
                              <div className="space-y-2 border-t border-slate-200/70 pt-3">
                                <div>
                                  <Label className="text-[11px] font-bold text-slate-600">
                                    Nota para el creador (opcional, se le envía por
                                    notificación)
                                  </Label>
                                  <Input
                                    value={notes[r.id] || ""}
                                    onChange={(e) =>
                                      setNotes((n) => ({
                                        ...n,
                                        [r.id]: e.target.value
                                      }))
                                    }
                                    placeholder={
                                      tab === "rejected"
                                        ? "Explica por qué se rechaza (documento ilegible, etc)."
                                        : "Ej: todo correcto, QR OK."
                                    }
                                    className="mt-1 h-9 text-xs"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 !border-rose-200 !text-rose-700 hover:!bg-rose-50"
                                    disabled={loadingId[r.id]}
                                    onClick={() => review(r.id, "rejected")}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    {loadingId[r.id]
                                      ? "Procesando..."
                                      : "Rechazar solicitud"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-9 !bg-gradient-to-r from-emerald-500 to-green-600 !text-white font-bold"
                                    disabled={loadingId[r.id]}
                                    onClick={() => review(r.id, "approved")}
                                  >
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    {loadingId[r.id]
                                      ? "Aprobando..."
                                      : "Aprobar verificación"}
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
    </main>
  );
}
