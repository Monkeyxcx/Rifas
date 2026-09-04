"use client";

import { useMemo, useState } from "react";
import { Check, Globe, Loader2, MapPin, NotebookPen, Save, ShieldCheck, Smartphone, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
        toast.success("Perfil actualizado correctamente 🎉");
      } else {
        const txt = await res.text();
        toast.error(txt ? `No se pudo guardar: ${txt.slice(0, 80)}` : "No se pudo actualizar el perfil");
      }
    } catch {
      toast.error("Error de conexión al guardar. Revisa tu internet.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="datos" className="border-slate-200 shadow-sm scroll-mt-24">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-rose to-brand-violet text-white">
            <UserRound className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <CardTitle className="font-display text-lg">Datos personales</CardTitle>
            <CardDescription>
              Esta es la información que verán otros usuarios y las rifas que crees.
            </CardDescription>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {ok && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                <Check className="h-3.5 w-3.5" />
                Cambios guardados
              </span>
            )}
            <Button
              type="button"
              className="!bg-gradient-to-r from-brand-rose to-brand-violet font-bold shadow-cta h-10 px-5 disabled:opacity-70"
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
            <Label htmlFor="pf-fullname" className="flex items-center gap-1.5 font-bold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
              Nombre público completo
            </Label>
            <Input
              id="pf-fullname"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Ej: Alejandro Gómez Martínez"
              className="h-11 !border-slate-200 focus-visible:!ring-brand-rose"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-display" className="flex items-center gap-1.5 font-bold text-slate-700">
              <UserRound className="h-3.5 w-3.5 text-brand-violet" />
              Nickname / nombre a mostrar
            </Label>
            <Input
              id="pf-display"
              value={form.display_name}
              onChange={(e) => handleChange("display_name", e.target.value)}
              placeholder="Ej: AlejoGómez88"
              className="h-11 !border-slate-200 focus-visible:!ring-brand-violet"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="pf-email" className="flex items-center gap-1.5 font-bold text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Email (inmutable)
            </Label>
            <Input
              id="pf-email"
              readOnly
              disabled
              value={email}
              className="h-11 !bg-slate-50 !border-slate-200 !text-slate-600 cursor-not-allowed select-none"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="pf-phone" className="flex items-center gap-1.5 font-bold text-slate-700">
              <Smartphone className="h-3.5 w-3.5 text-brand-rose" />
              Teléfono móvil
            </Label>
            <Input
              id="pf-phone"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+57 300 123 4567"
              inputMode="tel"
              className="h-11 !border-slate-200 focus-visible:!ring-brand-rose font-mono"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="pf-country" className="flex items-center gap-1.5 font-bold text-slate-700">
              <Globe className="h-3.5 w-3.5 text-brand-cyan" />
              País / Región
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="pf-country"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder="Colombia, Medellín…"
                className="h-11 !pl-10 !border-slate-200 focus-visible:!ring-brand-cyan"
              />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-bio" className="flex items-center gap-1.5 font-bold text-slate-700">
            <NotebookPen className="h-3.5 w-3.5 text-brand-violet" />
            Biografía corta
          </Label>
          <Textarea
            id="pf-bio"
            value={form.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            placeholder="Cuéntanos quién eres, te gusta el emprendimiento, las rifas solidarias, etc. (máx 200 chars)"
            maxLength={200}
            className="!border-slate-200 focus-visible:!ring-brand-violet min-h-[110px] resize-none"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Esta bio aparece en tu perfil y en las rifas que crees.</span>
            <span className="font-bold tabular-nums text-slate-500">{form.bio.length}/200</span>
          </div>
        </div>
        <div className="sm:hidden pt-2">
          {ok && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
              <Check className="h-3.5 w-3.5" />
              Cambios guardados correctamente
            </div>
          )}
          <Button
            type="button"
            className="w-full !bg-gradient-to-r from-brand-rose to-brand-violet font-bold shadow-cta h-11 disabled:opacity-70"
            onClick={onSave}
            disabled={!changed || saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Guardando cambios…" : "Guardar cambios en el perfil"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileSaveForm;
