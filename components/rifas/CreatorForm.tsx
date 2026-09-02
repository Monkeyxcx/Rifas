"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import { cn, formatCurrency, generateRaffleNumbers, padRaffleNumber } from "@/lib/utils";
import type { Rifa } from "@/lib/types";

type StepKey = "datos" | "premio" | "numeros" | "fechas";

const STEPS: Array<{ key: StepKey; title: string; desc: string }> = [
  { key: "datos", title: "Datos", desc: "Título y descripción" },
  { key: "premio", title: "Premio / Causa", desc: "Premio y solidaria" },
  { key: "numeros", title: "Números", desc: "Rango y precio" },
  { key: "fechas", title: "Fechas", desc: "Cierre y sorteo" }
];

interface CreatorFormState {
  title: string;
  description: string;
  prize_name: string;
  prize_value: number;
  is_solidarity: boolean;
  cause_name: string;
  cause_description: string;
  cause_target: number;
  total_numbers: number;
  number_price: number;
  ends_at_date: string;
  draw_date_date: string;
  draw_instructions: string;
  country: string;
}

const DEFAULT: CreatorFormState = {
  title: "",
  description: "",
  prize_name: "",
  prize_value: 500_000,
  is_solidarity: false,
  cause_name: "",
  cause_description: "",
  cause_target: 0,
  total_numbers: 100,
  number_price: 10_000,
  ends_at_date: "",
  draw_date_date: "",
  draw_instructions:
    "Sorteo en vivo por redes sociales con 2 testigos + hash público.",
  country: "Colombia"
};

function isoDateInput(offsetDays = 7) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CreatorForm() {
  const router = useRouter();
  const [stepKey, setStepKey] = useState<StepKey>("datos");
  const [form, setForm] = useState<CreatorFormState>({
    ...DEFAULT,
    ends_at_date: isoDateInput(14),
    draw_date_date: isoDateInput(15)
  });
  const [submitting, setSubmitting] = useState(false);

  const projected = useMemo(() => {
    const total = Math.max(10, Math.min(100, form.total_numbers));
    const gross = total * form.number_price;
    const soldSample = Math.floor(total * 0.28);
    const numbers = generateRaffleNumbers(total);
    const ends_at = form.ends_at_date ? new Date(form.ends_at_date + "T20:00:00").toISOString() : null;
    const draw_date = form.draw_date_date ? new Date(form.draw_date_date + "T19:00:00").toISOString() : null;
    const mock: Rifa = {
      id: "preview",
      creator_id: "me",
      title: form.title || "Mi rifa (preview)",
      slug: null,
      description: form.description || null,
      prize_name: form.prize_name || "Premio a sortear",
      prize_image_url: null,
      prize_value: form.prize_value,
      is_solidarity: form.is_solidarity,
      cause_name: form.is_solidarity ? form.cause_name || null : null,
      cause_description: form.is_solidarity ? form.cause_description || null : null,
      cause_target: form.is_solidarity ? form.cause_target : 0,
      number_price: form.number_price,
      total_numbers: total,
      available_numbers: total - soldSample,
      status: "draft",
      ends_at,
      draw_date,
      draw_instructions: form.draw_instructions || null,
      banner_ad_config: null,
      metadata: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: {
        id: "me",
        full_name: "Tu organización",
        avatar_url: null,
        country: form.country
      }
    };
    return { mock, gross, numbers, total, soldSample };
  }, [form]);

  function update<K extends keyof CreatorFormState>(key: K, value: CreatorFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function stepIndex(key: StepKey) {
    return STEPS.findIndex((s) => s.key === key);
  }

  function goNext() {
    const idx = stepIndex(stepKey);
    if (idx < STEPS.length - 1) setStepKey(STEPS[idx + 1].key);
  }

  function goPrev() {
    const idx = stepIndex(stepKey);
    if (idx > 0) setStepKey(STEPS[idx - 1].key);
  }

  function canContinue() {
    switch (stepKey) {
      case "datos":
      default:
        return form.title.trim().length >= 6;
      case "premio":
        return (
          form.prize_name.trim().length >= 3 &&
          form.prize_value >= 50_000 &&
          (!form.is_solidarity || form.cause_name.trim().length >= 3)
        );
      case "numeros":
        return form.number_price >= 1_000 && form.total_numbers >= 10;
      case "fechas":
        return (
          !!form.ends_at_date &&
          !!form.draw_date_date &&
          form.draw_instructions.trim().length >= 10
        );
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue() && stepKey !== "fechas") {
      toast.error("Revisa los campos antes de continuar");
      return;
    }
    if (stepKey !== "fechas") {
      goNext();
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    toast.success(
      "¡Rifa creada en modo borrador (mock)! Cuando conectes Supabase se guardará de verdad."
    );
    setSubmitting(false);
    router.push("/mis-rifas/creadas");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-6">
        <Card className="border border-slate-200/70 shadow-none">
          <CardContent className="p-5">
            <ol className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STEPS.map((s, idx) => {
                const active = s.key === stepKey;
                const done = stepIndex(stepKey) > idx;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => setStepKey(s.key)}
                      className={cn(
                        "w-full text-left rounded-xl border p-3 transition",
                        active
                          ? "border-transparent bg-gradient-to-r from-brand-rose to-brand-violet text-white shadow-cta"
                          : done
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                            active
                              ? "bg-white/20 text-white"
                              : done
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {done ? "✓" : idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold leading-none truncate">
                            {s.title}
                          </div>
                          <div
                            className={cn(
                              "text-[11px] mt-0.5 truncate",
                              active ? "text-white/80" : "text-slate-400"
                            )}
                          >
                            {s.desc}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 shadow-sm">
          <CardContent className="p-6 space-y-5">
            {stepKey === "datos" && (
              <>
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900">
                    Datos de la rifa
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Usa un título claro que llame la atención del participante.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>
                    Título de la rifa <span className="text-brand-rose">*</span>
                  </Label>
                  <Input
                    placeholder="Ej: iPhone 15 Pro Max — Edición Titanio 256GB"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    maxLength={90}
                  />
                  <div className="text-xs text-slate-400">
                    {form.title.length}/90 caracteres
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    rows={4}
                    placeholder="Cuenta qué incluye el premio, detalles del envío, condiciones, etc."
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    maxLength={500}
                  />
                  <div className="text-xs text-slate-400 text-right">
                    {form.description.length}/500
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>País desde donde creas la rifa</Label>
                  <Input
                    placeholder="Colombia · México · Argentina…"
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                  />
                </div>
              </>
            )}

            {stepKey === "premio" && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900">
                      Premio a sortear
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Describelo bien. Si es solidaria, activa el toggle y agrega la causa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update("is_solidarity", !form.is_solidarity)}
                    className={cn(
                      "relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      form.is_solidarity
                        ? "bg-gradient-to-r from-brand-cyan to-brand-rose"
                        : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block h-8 w-8 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        form.is_solidarity ? "translate-x-7" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Nombre del premio <span className="text-brand-rose">*</span>
                    </Label>
                    <Input
                      placeholder="Ej: iPhone 15 Pro Max 256GB Titanio"
                      value={form.prize_name}
                      onChange={(e) => update("prize_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Valor estimado del premio (COP){" "}
                      <span className="text-brand-rose">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={50000}
                      step={50000}
                      value={form.prize_value}
                      onChange={(e) => update("prize_value", Number(e.target.value))}
                    />
                    <div className="text-xs text-slate-400">Mínimo $ 50.000</div>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Imagen del premio (proximamente upload Supabase Storage)
                    </Label>
                    <div className="flex aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-brand-rose/5 via-white to-brand-violet/5 place-items-center grid text-slate-400 text-sm">
                      📷 Subir imagen del premio
                    </div>
                  </div>
                </div>

                <Separator />

                <div
                  className={cn(
                    "rounded-xl p-5 transition",
                    form.is_solidarity
                      ? "bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-rose/10 border border-brand-cyan/20"
                      : "bg-slate-50/50 border border-dashed border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Badge
                      variant={form.is_solidarity ? "solidarity" : "outline"}
                      className="uppercase tracking-wider text-[10px]"
                    >
                      {form.is_solidarity
                        ? "✓ Rifas solidarias ON"
                        : "Modo solidaria OFF"}
                    </Badge>
                    <div className="text-xs text-slate-500">
                      {form.is_solidarity
                        ? "Los participantes verán tu causa y el % que se dona."
                        : "Actívalo si quieres destinar parte o toda la recaudación a una causa."}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>
                        Nombre de la causa / fundación
                        {form.is_solidarity && (
                          <span className="text-brand-rose"> *</span>
                        )}
                      </Label>
                      <Input
                        disabled={!form.is_solidarity}
                        placeholder="Ej: Fundación Unidos por los Niños A.C."
                        value={form.cause_name}
                        onChange={(e) => update("cause_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Descripción de la causa</Label>
                      <Textarea
                        rows={3}
                        disabled={!form.is_solidarity}
                        placeholder="A qué va destinado el dinero, cuántas familias se benefician, fotos que publicarás después…"
                        value={form.cause_description}
                        onChange={(e) => update("cause_description", e.target.value)}
                        maxLength={400}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta de recaudación (COP)</Label>
                      <Input
                        type="number"
                        disabled={!form.is_solidarity}
                        min={0}
                        step={50000}
                        value={form.cause_target}
                        onChange={(e) => update("cause_target", Number(e.target.value))}
                      />
                      <div className="text-xs text-slate-400">
                        Meta visible en la rifa (opcional)
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {stepKey === "numeros" && (
              <>
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900">
                    Números y precio
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Escoge cuántos números venderás y el valor de cada uno. Máximo 100.
                  </p>
                </div>
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                  <div className="flex items-center justify-between">
                    <Label className="!mb-0">Total de números a vender</Label>
                    <Badge variant="secondary" className="font-numbers tabular-nums">
                      {form.total_numbers}
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={10}
                    value={form.total_numbers}
                    onChange={(e) => update("total_numbers", Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-rose"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-400 font-numbers tabular-nums">
                    <span>10</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                  <div className="flex items-center justify-between">
                    <Label className="!mb-0">Precio por número</Label>
                    <Badge variant="active" className="font-numbers tabular-nums">
                      {formatCurrency(form.number_price)}
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={100_000}
                    step={1000}
                    value={form.number_price}
                    onChange={(e) => update("number_price", Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-violet"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Input
                      type="number"
                      min={1000}
                      step={1000}
                      value={form.number_price}
                      onChange={(e) => update("number_price", Number(e.target.value))}
                    />
                    <div className="grid grid-cols-4 gap-1.5">
                      {[5000, 10000, 25000, 50000].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => update("number_price", p)}
                          className={cn(
                            "rounded-lg border px-1.5 py-1 text-[11px] font-medium transition",
                            form.number_price === p
                              ? "border-transparent bg-gradient-to-r from-brand-rose to-brand-violet text-white shadow-cta"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {p / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <Card className="border-slate-200 bg-white/60">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-wider">
                        Recaudación total
                      </div>
                      <div className="mt-1 font-display font-black text-xl text-slate-900">
                        {formatCurrency(projected.gross)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 bg-white/60">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-wider">
                        Premio
                      </div>
                      <div className="mt-1 font-display font-black text-xl text-brand-rose">
                        {form.prize_value >= projected.gross ? "⚠ " : ""}
                        {formatCurrency(form.prize_value)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      "bg-gradient-to-br text-white border-0",
                      form.is_solidarity
                        ? "from-brand-cyan to-brand-rose"
                        : "from-brand-violet to-brand-rose"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="text-xs uppercase tracking-wider opacity-80">
                        {form.is_solidarity ? "Impacto potencial" : "Margen bruto"}
                      </div>
                      <div className="mt-1 font-display font-black text-xl">
                        {form.is_solidarity
                          ? formatCurrency(Math.max(0, projected.gross - form.prize_value))
                          : formatCurrency(projected.gross - form.prize_value)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="!mb-0">
                      Vista previa de números ({projected.numbers.length} números)
                    </Label>
                    <span className="text-xs text-slate-400">
                      00 a {padRaffleNumber(projected.numbers.length - 1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1 text-center font-numbers tabular-nums">
                    {projected.numbers.slice(0, 50).map((n, i) => {
                      const sold = i < projected.soldSample;
                      return (
                        <div
                          key={n}
                          className={cn(
                            "h-9 rounded-md text-[11px] font-semibold leading-none grid place-items-center",
                            sold
                              ? "bg-slate-100 text-slate-300 line-through"
                              : "bg-white border border-slate-200 text-slate-700"
                          )}
                        >
                          {n}
                        </div>
                      );
                    })}
                    {projected.numbers.length > 50 && (
                      <div className="col-span-10 py-1 text-center text-xs text-slate-400">
                        … y {projected.numbers.length - 50} más
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {stepKey === "fechas" && (
              <>
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900">
                    Cierre y sorteo
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Define cuándo dejarás de vender números y cuándo se hará el sorteo público.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Fecha límite de venta <span className="text-brand-rose">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={form.ends_at_date}
                      onChange={(e) => update("ends_at_date", e.target.value)}
                    />
                    <div className="text-xs text-slate-400">
                      Los participantes ya no podrán comprar después de este día a las 20:00
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Fecha y hora del sorteo <span className="text-brand-rose">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={form.draw_date_date}
                      onChange={(e) => update("draw_date_date", e.target.value)}
                    />
                    <div className="text-xs text-slate-400">
                      Día del sorteo público, 19:00. Debe ser ≥ cierre o posterior.
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    Instrucciones del sorteo <span className="text-brand-rose">*</span>
                  </Label>
                  <Textarea
                    rows={4}
                    placeholder="¿Dónde lo harás? ¿Qué testigos habrá? ¿Herramienta de sorteo?"
                    value={form.draw_instructions}
                    onChange={(e) => update("draw_instructions", e.target.value)}
                    maxLength={300}
                  />
                  <div className="text-xs text-slate-400 text-right">
                    {form.draw_instructions.length}/300
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <Card className="bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        🎲 Método de sorteo sugerido
                      </div>
                      <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                        <li>• En vivo por Instagram / TikTok / YouTube</li>
                        <li>• 2 testigos sorteadores públicos</li>
                        <li>• Herramienta sorteador público (hash + screenshots)</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-brand-cyan/5 via-white to-brand-rose/5 border border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        🛡️ Transparencia (nuestro compromiso)
                      </div>
                      <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                        <li>• Publicamos lista oficial de números</li>
                        <li>• Foto del ganador y entrega confirmada</li>
                        <li>• Soporte humano 24/7</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={goPrev}
            disabled={stepIndex(stepKey) === 0}
          >
            ← Atrás
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/rifas")}
            >
              Cancelar
            </Button>
            {stepKey === "fechas" ? (
              <Button
                type="submit"
                className="!bg-gradient-to-r from-brand-rose to-brand-violet shadow-cta active:scale-[0.98]"
                disabled={!canContinue() || submitting}
              >
                {submitting ? "Creando…" : "✓ Crear rifa"}
              </Button>
            ) : (
              <Button
                type="submit"
                className="!bg-gradient-to-r from-brand-rose to-brand-violet shadow-cta active:scale-[0.98]"
                disabled={!canContinue()}
              >
                Continuar →
              </Button>
            )}
          </div>
        </div>
      </div>

      <aside className="lg:col-span-2 space-y-4 lg:sticky lg:top-24 self-start">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white overflow-hidden shadow-sm">
          <div
            className={cn(
              "relative aspect-[4/3] overflow-hidden",
              projected.mock.is_solidarity
                ? "bg-gradient-to-br from-brand-cyan via-cyan-500 to-brand-rose"
                : "bg-gradient-to-br from-brand-rose via-pink-500 to-brand-violet"
            )}
          >
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur grid place-items-center text-4xl">
                {projected.mock.is_solidarity ? "💝" : "🏆"}
              </div>
            </div>
            <div className="absolute top-3 left-3">
              <Badge
                variant={projected.mock.is_solidarity ? "solidarity" : "prize"}
                className="shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)]"
              >
                {projected.mock.is_solidarity ? "Solidaria · Borrador" : "Premio · Borrador"}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              <Badge
                variant="secondary"
                className="uppercase tracking-[0.18em] text-[10px]"
              >
                VALOR
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-white font-numbers font-black text-2xl drop-shadow-sm tabular-nums">
                {formatCurrency(form.prize_value)}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <h4 className="font-display font-black text-xl text-slate-900 leading-tight line-clamp-2">
              {projected.mock.title}
            </h4>

            <Progress
              value={(projected.soldSample / projected.total) * 100}
              className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-rose [&>div]:to-brand-violet [&>div]:rounded-full"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                <span className="font-display font-bold text-slate-800">
                  {projected.soldSample}
                </span>{" "}
                / {projected.total} vendidos (demo)
              </span>
              <span className="font-numbers tabular-nums font-semibold text-brand-rose">
                {Math.round((projected.soldSample / projected.total) * 100)}%
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Desde
                </div>
                <div className="font-numbers tabular-nums font-bold text-slate-800">
                  {formatCurrency(form.number_price)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  País
                </div>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  📍 {form.country || "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Cierra
                </div>
                <div className="font-semibold text-slate-800">
                  {form.ends_at_date
                    ? new Date(form.ends_at_date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short"
                      })
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Sorteo
                </div>
                <div className="font-semibold text-slate-800">
                  {form.draw_date_date
                    ? new Date(form.draw_date_date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short"
                      })
                    : "—"}
                </div>
              </div>
            </div>

            {projected.mock.is_solidarity && form.cause_name && (
              <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-3 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-brand-cyan-700 font-bold">
                  💝 Causa solidaria
                </div>
                <div className="font-bold text-slate-800">{form.cause_name}</div>
                {form.cause_target > 0 && (
                  <div className="text-xs text-slate-500">
                    Meta: {formatCurrency(form.cause_target)}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-10 gap-1 text-center font-numbers tabular-nums">
              {generateRaffleNumbers(Math.min(30, projected.total)).map((n, i) => (
                <div
                  key={n}
                  className={cn(
                    "h-7 rounded text-[10px] font-bold grid place-items-center",
                    i < Math.floor(projected.total * 0.28)
                      ? "bg-slate-100 text-slate-300"
                      : "bg-gradient-to-br from-slate-50 to-white border border-slate-200 text-slate-700"
                  )}
                >
                  {n}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/rifas/preview`)}
              disabled
            >
              🔍 Ver página completa (proximamente)
            </Button>
          </div>
        </div>

        <Card className="border border-dashed border-slate-200 bg-slate-50/60">
          <CardContent className="p-4 text-xs space-y-2">
            <div className="font-semibold text-slate-700 flex items-center gap-2">
              💡 Consejo
            </div>
            <ul className="space-y-1 text-slate-500">
              <li>• Las rifas con foto del premio se venden 3x más.</li>
              <li>• Precios menores a $ 15k tienen 2x más participación.</li>
              <li>• Cuéntale a tus redes el día del sorteo con 24h de antelación.</li>
            </ul>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
