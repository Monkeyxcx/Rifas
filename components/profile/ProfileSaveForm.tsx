"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, MapPin, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/lib/ui/modals";
import type { Perfil } from "@/lib/types";

type Props = {
  perfil: Perfil;
  email: string;
};

type FormState = {
  full_name: string;
  display_name: string;
  phone: string;
  country: string;
  bio: string;
};

export function ProfileSaveForm({ perfil, email }: Props) {
  const [form, setForm] = useState<FormState>({
    full_name: perfil.full_name ?? "",
    display_name: perfil.display_name ?? "",
    phone: perfil.phone ?? "",
    country: perfil.country ?? "",
    bio: perfil.bio ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  const changed = useMemo(() => {
    return (
      (perfil.full_name ?? "") !== form.full_name ||
      (perfil.display_name ?? "") !== form.display_name ||
      (perfil.phone ?? "") !== form.phone ||
      (perfil.country ?? "") !== form.country ||
      (perfil.bio ?? "") !== form.bio
    );
  }, [form, perfil]);

  const handleChange = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setOk(false);
  };

  const onSave = async () => {
    if (!changed || saving) return;
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim() || null,
        display_name: form.display_name.trim() || null,
        phone: form.phone.trim() || null,
        country: form.country.trim() || null,
        bio: form.bio.trim() || null
      };
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setOk(true);
        void showSuccess({
          title: "Perfil actualizado 🎉",
          message: "Tus datos se guardaron correctamente.",
          timer: 2100
        });
      } else {
        const txt = await res.text();
        void showError({
          title: "No se pudo guardar el perfil",
          message: txt ? `Respuesta servidor: ${txt.slice(0, 120)}` : "Intenta de nuevo."
        });
      }
    } catch {
      void showError({
        title: "Error de conexión",
        message: "Sin conexión al servidor. Revisa tu internet e intenta de nuevo."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <CardTitle className="font-display text-lg">Datos personales</CardTitle>
            <CardDescription>
              Esta es la información que verán otros usuarios y las rifas que crees.
            </CardDescription>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {ok && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <Check className="h-3.5 w-3.5" />
                Guardado
              </span>
            )}
            <Button
              type="button"
              className="h-10 bg-brand-rose px-5 font-semibold text-white hover:bg-brand-rose/90 disabled:opacity-70"
              onClick={onSave}
              disabled={!changed || saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pf-fullname" className="font-semibold text-slate-700">
              Nombre público completo
            </Label>
            <Input
              id="pf-fullname"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Ej: Alejandro Gómez Martínez"
              className="h-11 border-slate-200 focus-visible:ring-brand-rose"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-display" className="font-semibold text-slate-700">
              Nickname / nombre a mostrar
            </Label>
            <Input
              id="pf-display"
              value={form.display_name}
              onChange={(e) => handleChange("display_name", e.target.value)}
              placeholder="Ej: AlejoGómez88"
              className="h-11 border-slate-200 focus-visible:ring-brand-rose"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="pf-email" className="font-semibold text-slate-700">
              Email (inmutable)
            </Label>
            <Input
              id="pf-email"
              readOnly
              disabled
              value={email}
              className="h-11 cursor-not-allowed select-none border-slate-200 bg-slate-50 text-slate-600"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="pf-phone" className="font-semibold text-slate-700">
              Teléfono móvil
            </Label>
            <Input
              id="pf-phone"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+57 300 123 4567"
              inputMode="tel"
              className="h-11 border-slate-200 font-mono focus-visible:ring-brand-rose"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="pf-country" className="font-semibold text-slate-700">
              País / Región
            </Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="pf-country"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder="Colombia, Medellín…"
                className="h-11 border-slate-200 pl-10 focus-visible:ring-brand-rose"
              />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-bio" className="font-semibold text-slate-700">
            Biografía corta
          </Label>
          <Textarea
            id="pf-bio"
            value={form.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            placeholder="Cuéntanos quién eres (máx. 200 caracteres)"
            maxLength={200}
            className="min-h-[110px] resize-none border-slate-200 focus-visible:ring-brand-rose"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Aparece en tu perfil y en las rifas que crees.</span>
            <span className="tabular-nums font-semibold text-slate-500">{form.bio.length}/200</span>
          </div>
        </div>
        <div className="pt-2 sm:hidden">
          {ok && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <Check className="h-3.5 w-3.5" />
              Guardado
            </div>
          )}
          <Button
            type="button"
            className="h-11 w-full bg-brand-rose font-semibold text-white hover:bg-brand-rose/90 disabled:opacity-70"
            onClick={onSave}
            disabled={!changed || saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileSaveForm;
