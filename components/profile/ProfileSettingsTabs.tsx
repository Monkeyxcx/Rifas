"use client";

import {
  Bell,
  Clock3,
  CreditCard,
  FileText,
  Globe,
  KeyRound,
  Mail,
  Phone,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import NequiVerificationForm from "@/components/nequi/NequiVerificationForm";
import { ProfileSaveForm } from "@/components/profile/ProfileSaveForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Perfil, UserNequiVerification } from "@/lib/types";

const TABS = [
  { id: "datos", label: "Datos", icon: Settings2 },
  { id: "cobros", label: "Cobros", icon: Phone },
  { id: "seguridad", label: "Seguridad", icon: KeyRound },
  { id: "notificaciones", label: "Avisos", icon: Bell },
  { id: "facturacion", label: "Pagos", icon: CreditCard },
  { id: "peligro", label: "Cuenta", icon: ShieldAlert }
] as const;

type Props = {
  perfil: Perfil;
  email: string;
  userId: string;
  latestNequiVerification: UserNequiVerification | null;
};

export function ProfileSettingsTabs({
  perfil,
  email,
  userId,
  latestNequiVerification
}: Props) {
  return (
    <Tabs defaultValue="datos" className="w-full">
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <TabsList className="h-auto w-full min-w-max justify-start gap-0.5 bg-slate-100/80 p-1 sm:w-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:text-slate-900"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="datos" className="mt-5 focus-visible:ring-0">
        <ProfileSaveForm perfil={perfil} email={email} />
      </TabsContent>

      <TabsContent value="cobros" className="mt-5 focus-visible:ring-0">
        <NequiVerificationForm userId={userId} latest={latestNequiVerification} />
      </TabsContent>

      <TabsContent value="seguridad" className="mt-5 focus-visible:ring-0">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Seguridad y acceso</CardTitle>
            <CardDescription>
              Gestiona tu contraseña y dispositivos conectados.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="h-11 justify-start border-slate-200" disabled>
              <KeyRound className="mr-2 h-4 w-4 text-slate-400" />
              Cambiar contraseña (próximamente)
            </Button>
            <Button variant="outline" className="h-11 justify-start border-slate-200" disabled>
              <ShieldCheck className="mr-2 h-4 w-4 text-slate-400" />
              Dispositivos conectados (próximamente)
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notificaciones" className="mt-5 focus-visible:ring-0">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Notificaciones</CardTitle>
            <CardDescription>
              Elige por dónde quieres que te avisemos de sorteos, pagos y rifas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { icon: Mail, t: "Notificaciones por email", d: "Pagos, rifas ganadas, recordatorios" },
              { icon: Sparkles, t: "Anuncios de nuevas rifas", d: "Como máximo una vez por semana" },
              { icon: Clock3, t: "Recordatorios de cierre", d: "Cuando queden menos de 48h en tus rifas" }
            ].map((row) => (
              <div
                key={row.t}
                className="flex items-start justify-between gap-4 rounded-xl px-3 py-3.5 hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                    <row.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{row.t}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{row.d}</div>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 border-slate-200 text-slate-500">
                  Pronto
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="facturacion" className="mt-5 focus-visible:ring-0">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Facturación y pagos</CardTitle>
            <CardDescription>Información fiscal y métodos de pago.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="h-11 justify-start border-slate-200" disabled>
              <Globe className="mr-2 h-4 w-4 text-slate-400" />
              Datos fiscales (próximamente)
            </Button>
            <Button variant="outline" className="h-11 justify-start border-slate-200" disabled>
              <FileText className="mr-2 h-4 w-4 text-slate-400" />
              Historial de pagos (próximamente)
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="peligro" className="mt-5 focus-visible:ring-0">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Zona de cuenta</CardTitle>
            <CardDescription>
              Acciones sensibles. Revisa bien antes de confirmar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-slate-900">Anonimizar mi cuenta</div>
                <div className="text-xs text-slate-500">
                  Elimina tus datos personales y conserva el historial de rifas públicas.
                </div>
              </div>
              <Button variant="destructive" size="sm" disabled>
                Solicitar anonimización (pronto)
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default ProfileSettingsTabs;
