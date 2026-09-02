import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  BellOff,
  CalendarClock,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Globe,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  NotebookPen,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Ticket,
  Trash2,
  UserRoundPen,
  Wallet,
  PartyPopper,
  Clock3,
  Trophy,
  Gift,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { Perfil } from "@/lib/types";

export const revalidate = 0;

const perfilDemo: Perfil = {
  id: "user-demo-0001",
  display_name: "Usuario Demo",
  full_name: "Usuario Demo RifasCenter",
  avatar_url: null,
  phone: "+57 300 987 6543",
  country: "Colombia",
  bio: "Apasionado por los sorteos y apoyar causas solidarias. He participado en más de 20 rifas con RifasCenter. 🎯",
  wallet_balance: 45_200,
  is_verified: true,
  created_at: new Date(Date.now() - 180 * 86_400_000).toISOString(),
  updated_at: new Date(Date.now() - 7 * 86_400_000).toISOString()
};

const statsCreador = {
  creadas: 3,
  vendidos: 128,
  recaudado: 2_450_000
};

const statsParticipante = {
  tickets: 4,
  numerosComprados: 22,
  invertido: 892_800,
  ganados: 0
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

const navItems: NavItem[] = [
  { id: "datos", label: "Datos personales", icon: UserRoundPen, active: true },
  { id: "seguridad", label: "Seguridad y acceso", icon: KeyRound },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "facturacion", label: "Facturación y pagos", icon: CreditCard },
  { id: "peligro", label: "Zona peligrosa", icon: ShieldAlert }
];

export default function PerfilPage() {
  const initials = perfilDemo.full_name
    ?.split(" ")
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") ?? "UD";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container mx-auto max-w-7xl px-4 py-10 lg:py-12">
        {/* HEADER BANNER */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-violet via-brand-rose to-brand-gold p-7 lg:p-10 text-white shadow-xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
              backgroundSize: "20px 20px"
            }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-white/95 to-white/70 text-brand-rose text-2xl font-black shadow-cta ring-4 ring-white/30 backdrop-blur lg:h-24 lg:w-24 lg:text-3xl">
                  {initials}
                </div>
                {perfilDemo.is_verified && (
                  <BadgeCheck className="absolute -bottom-1 -right-1 h-8 w-8 text-emerald-400 drop-shadow" strokeWidth={2.4} />
                )}
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-black tracking-tight lg:text-3xl">
                    ¡Hola, {perfilDemo.display_name}! 👋
                  </h1>
                  {perfilDemo.is_verified && (
                    <Badge className="!bg-white/95 !text-emerald-600 !border-0 shadow text-[11px]">
                      <BadgeCheck className="mr-1 h-3 w-3" />
                      Verificado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-white/85 lg:text-base">
                  <Mail className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5" />
                  {perfilDemo.full_name?.toLowerCase().replace(/\s+/g, ".") ?? "usuario.demo"}@rifascenter.com
                  <span className="mx-2 opacity-60">·</span>
                  <MapPin className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5" />
                  {perfilDemo.country}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  <CalendarClock className="mr-1 inline h-3 w-3 -translate-y-0.5" />
                  Miembro desde{" "}
                  {new Date(perfilDemo.created_at).toLocaleDateString("es-CO", {
                    month: "long",
                    year: "numeric"
                  })}{" "}
                  · 6 meses en la plataforma
                </p>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="!border-0 !bg-white/15 !text-white backdrop-blur ring-1 ring-white/20">
                <CardContent className="p-3 lg:p-4 text-center">
                  <Ticket className="mx-auto mb-1 h-5 w-5 text-white/80" />
                  <p className="font-numbers text-2xl font-black tabular-nums">{statsParticipante.tickets}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/75">Tickets</p>
                </CardContent>
              </Card>
              <Card className="!border-0 !bg-white/15 !text-white backdrop-blur ring-1 ring-white/20">
                <CardContent className="p-3 lg:p-4 text-center">
                  <PartyPopper className="mx-auto mb-1 h-5 w-5 text-white/80" />
                  <p className="font-numbers text-2xl font-black tabular-nums">{statsCreador.creadas}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/75">Rifas creadas</p>
                </CardContent>
              </Card>
              <Card className="!border-0 !bg-white/15 !text-white backdrop-blur ring-1 ring-white/20">
                <CardContent className="p-3 lg:p-4 text-center">
                  <Wallet className="mx-auto mb-1 h-5 w-5 text-white/80" />
                  <p className="font-numbers text-2xl font-black tabular-nums">
                    {formatCurrency(perfilDemo.wallet_balance)}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/75">Saldo wallet</p>
                </CardContent>
              </Card>
              <Card className="!border-0 !bg-white/15 !text-white backdrop-blur ring-1 ring-white/20">
                <CardContent className="p-3 lg:p-4 text-center">
                  <NotebookPen className="mx-auto mb-1 h-5 w-5 text-white/80" />
                  <p className="font-numbers text-2xl font-black tabular-nums">{statsCreador.vendidos}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/75">Números vend</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* LAYOUT 2 COLS */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* SIDEBAR NAV */}
          <aside className="space-y-4 lg:sticky lg:top-[92px] self-start">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={`#${item.id}`}
                        className={`flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition border-l-4 ${
                          item.active
                            ? "border-brand-rose !bg-rose-50/60 text-brand-rose"
                            : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* WALLET CARD */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Saldo en wallet
                  </CardTitle>
                  <Badge className="!bg-emerald-500 !text-white !border-0 text-[10px]">DISPONIBLE</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                <p className="font-numbers text-3xl font-black tabular-nums tracking-tight text-emerald-600">
                  {formatCurrency(perfilDemo.wallet_balance)}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Última recarga · hace 12 días
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    size="sm"
                    className="h-9 !bg-gradient-to-r from-emerald-500 to-brand-cyan !text-white font-bold"
                  >
                    <CreditCard className="mr-1 h-3.5 w-3.5" />
                    Recargar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 !border-emerald-200 !text-emerald-700 font-bold"
                  >
                    <FileText className="mr-1 h-3.5 w-3.5" />
                    Retirar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* RÁPIDOS */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-3 grid gap-1.5">
                <Button asChild variant="outline" className="!h-10 justify-start !border-slate-200 !text-slate-700 font-bold">
                  <Link href="/mis-rifas/creadas">
                    <Ticket className="mr-2 h-4 w-4 text-brand-rose" /> Mis rifas creadas
                  </Link>
                </Button>
                <Button asChild variant="outline" className="!h-10 justify-start !border-slate-200 !text-slate-700 font-bold">
                  <Link href="/mis-rifas/participando">
                    <PartyPopper className="mr-2 h-4 w-4 text-brand-cyan" /> Mis participaciones
                  </Link>
                </Button>
                <Button asChild variant="outline" className="!h-10 justify-start !border-slate-200 !text-slate-700 font-bold">
                  <Link href="/rifas/crear">
                    <NotebookPen className="mr-2 h-4 w-4 text-brand-violet" /> Crear rifa nueva
                  </Link>
                </Button>
                <Separator className="my-1" />
                <Button variant="ghost" className="!h-10 justify-start font-bold !text-slate-500 hover:!text-rose-500">
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* MAIN CONTENT · 5 SECTIONS */}
          <section className="space-y-6">
            {/* 1 · DATOS PERSONALES */}
            <Card id="datos" className="border-slate-200 shadow-sm scroll-mt-24">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-rose to-brand-violet text-white">
                    <UserRoundPen className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg">Datos personales</CardTitle>
                    <CardDescription>
                      Esta información es la que verán los demás usuarios y creadores.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="display_name">Nombre visible (público)</Label>
                    <Input id="display_name" defaultValue={perfilDemo.display_name ?? ""} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name">Nombre completo (privado)</Label>
                    <Input id="full_name" defaultValue={perfilDemo.full_name ?? ""} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        defaultValue="usuario.demo@rifascenter.com"
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                      Teléfono / WhatsApp
                    </Label>
                    <Input id="phone" defaultValue={perfilDemo.phone ?? ""} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country" className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-slate-400" /> País
                    </Label>
                    <Input id="country" defaultValue={perfilDemo.country ?? ""} className="h-11" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="bio">Biografía corta (máx 200 caracteres)</Label>
                    <Textarea
                      id="bio"
                      defaultValue={perfilDemo.bio ?? ""}
                      rows={3}
                      className="resize-none"
                      maxLength={200}
                    />
                    <p className="text-[11px] font-semibold text-slate-400 text-right">
                      {(perfilDemo.bio?.length ?? 0)} / 200
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <p className="text-xs font-semibold text-slate-500">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-500" />
                  Tus datos están protegidos con cifrado AES-256 y nunca se comparten sin tu consentimiento.
                </p>
                <Button
                  size="lg"
                  className="h-12 !bg-gradient-to-r from-brand-rose to-brand-violet !text-white font-black shadow-cta"
                >
                  <Save className="mr-1.5 h-4.5 w-4.5" />
                  Guardar cambios
                </Button>
              </CardFooter>
            </Card>

            {/* 2 · SEGURIDAD */}
            <Card id="seguridad" className="border-slate-200 shadow-sm scroll-mt-24">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-violet to-brand-gold text-white">
                    <KeyRound className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg">Seguridad y acceso</CardTitle>
                    <CardDescription>
                      Mantén tu cuenta segura. Recomendamos activar 2FA y usar contraseña única.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Card className="!border-brand-violet/30 !bg-violet-50/40 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      🔐 Contraseña
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Último cambio · hace 3 meses. Recomendamos actualizarla cada 90 días.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="relative">
                      <Input type="password" defaultValue="••••••••••••••••" className="h-10 pl-3 pr-10" />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                        <EyeOff className="h-4 w-4" />
                      </button>
                    </div>
                    <Button size="sm" className="h-9 !bg-white !text-brand-violet !border !border-brand-violet/40 font-bold shadow-none">
                      Cambiar contraseña
                    </Button>
                  </CardContent>
                </Card>
                <Card className="!border-brand-gold/40 !bg-amber-50/50 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      🛡 Autenticación de dos pasos (2FA)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Añade una capa extra. Google Authenticator, Authy o SMS.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="secondary" className="!bg-amber-100 !text-amber-700 !border !border-amber-200">
                      ⚠️ Actualmente desactivado
                    </Badge>
                    <Button size="sm" className="h-9 !bg-gradient-to-r from-brand-gold to-rose-500 !text-white font-bold">
                      Activar 2FA ahora
                    </Button>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2 !border-slate-200 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-slate-800">
                      Sesiones activas · 2 dispositivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Chrome en Windows 11 <Badge variant="active" className="ml-2 h-4 text-[10px] px-1.5 py-0">ACTUAL</Badge>
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500">
                            Medellín, COL · IP 192.168.*** · hace 2 min
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 !text-slate-500 hover:!text-rose-500 font-bold">
                        - tú
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-rose/10 text-brand-rose">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Safari en iPhone 15</p>
                          <p className="text-[11px] font-semibold text-slate-500">
                            Bogotá, COL · IP 190.146.*** · hace 4 días
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 !h-8 !text-rose-500 !border-rose-200 font-bold">
                        Cerrar sesión
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* 3 · NOTIFICACIONES */}
            <Card id="notificaciones" className="border-slate-200 shadow-sm scroll-mt-24">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-gold to-rose-400 text-white">
                    <Bell className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg">Preferencias de notificaciones</CardTitle>
                    <CardDescription>
                      Te avisamos solo de lo importante. Puedes cambiarlo en cualquier momento.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {[
                  { t: "Pagos aprobados", d: "Ticket oficial y comprobante", def: true, on: true, icon: CreditCard, c: "emerald" },
                  { t: "Reserva por vencer", d: "Aviso cuando quedan 5 min", def: true, on: true, icon: Clock3, c: "rose" },
                  { t: "Resultado del sorteo", d: "Número ganador y ticket", def: true, on: true, icon: Trophy, c: "violet" },
                  { t: "Sorteos que sigo", d: "Recordatorios 24h antes", def: true, on: false, icon: Bell, c: "cyan" },
                  { t: "Ofertas y promociones", d: "Rifas destacadas semanales", def: false, on: false, icon: Gift, c: "gold" },
                  { t: "Anuncios plataforma", d: "Nuevas funciones y tips", def: false, on: true, icon: Sparkles, c: "amber" }
                ].map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-2xl border p-4 ${
                        n.on
                          ? "border-slate-200 bg-white"
                          : "border-dashed border-slate-300 bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                            n.c === "emerald"
                              ? "bg-emerald-50 text-emerald-600"
                              : n.c === "rose"
                              ? "bg-rose-50 text-rose-500"
                              : n.c === "violet"
                              ? "bg-violet-50 text-violet-600"
                              : n.c === "cyan"
                              ? "bg-cyan-50 text-cyan-600"
                              : n.c === "gold"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{n.t}</p>
                          <p className="text-xs font-semibold text-slate-500 truncate">{n.d}</p>
                        </div>
                      </div>
                      <Button
                        variant={n.on ? "default" : "outline"}
                        size="sm"
                        className={
                          n.on
                            ? "h-8 !bg-emerald-500 !text-white !border-0 font-bold shrink-0"
                            : "h-8 !text-slate-500 !border-slate-300 font-bold shrink-0"
                        }
                      >
                        {n.on ? (
                          <>
                            <Bell className="mr-1 h-3.5 w-3.5" /> ON
                          </>
                        ) : (
                          <>
                            <BellOff className="mr-1 h-3.5 w-3.5" /> OFF
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* 4 · FACTURACIÓN */}
            <Card id="facturacion" className="border-slate-200 shadow-sm scroll-mt-24">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-cyan to-emerald-500 text-white">
                    <CreditCard className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg">Facturación y pagos</CardTitle>
                    <CardDescription>
                      Gestiona tus métodos de pago guardados, facturas y retiros.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-brand-rose/30 bg-gradient-to-br from-rose-50 via-white to-violet-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-20 place-items-center rounded-xl bg-gradient-to-br from-brand-rose via-brand-violet to-brand-cyan text-white shadow-lg">
                        <div className="text-[10px] font-black tracking-widest">VISA</div>
                      </div>
                      <div>
                        <p className="font-numbers text-lg font-black tabular-nums text-slate-900">
                          •••• •••• •••• 4567
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          Titular Usuario Demo · Vence 08/29 · <Badge variant="active" className="ml-1 h-4 text-[10px] px-1.5 py-0">PRINCIPAL</Badge>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-9 !border-slate-300 !text-slate-700 font-bold">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 !border-slate-300 !text-slate-700 font-bold">
                        Historial
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 !bg-gradient-to-r from-brand-rose to-brand-violet !text-white font-bold"
                      >
                        + Añadir tarjeta
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Últimas 3 facturas</h4>
                    <Link href="#" className="text-xs font-bold text-brand-rose hover:underline">
                      Ver todas →
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {[
                      { n: "FAC-2026-0432", f: "hace 3 días", m: "$ 111.240", e: "Completada" },
                      { n: "FAC-2026-0398", f: "hace 8 días", m: "$ 320.000", e: "Completada" },
                      { n: "FAC-2026-0311", f: "hace 21 días", m: "$ 461.560", e: "Completada" }
                    ].map((f) => (
                      <div
                        key={f.n}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                      >
                        <div>
                          <p className="font-numbers text-sm font-bold text-slate-900 tabular-nums">{f.n}</p>
                          <p className="text-[11px] font-semibold text-slate-500">{f.f}</p>
                        </div>
                        <Badge variant="paid" className="!bg-emerald-100 !text-emerald-700 !border !border-emerald-200 text-[11px]">
                          {f.e}
                        </Badge>
                        <p className="font-numbers text-base font-black tabular-nums text-slate-900 min-w-[100px] text-right">
                          {f.m}
                        </p>
                        <Button variant="ghost" size="sm" className="h-8 !text-brand-violet font-bold">
                          <FileText className="mr-1 h-3.5 w-3.5" /> PDF
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5 · ZONA PELIGROSA */}
            <Card id="peligro" className="border-2 border-dashed border-rose-300 bg-rose-50/30 shadow-sm scroll-mt-24">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white">
                    <ShieldAlert className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg text-rose-800">Zona peligrosa</CardTitle>
                    <CardDescription className="text-rose-700/80">
                      Acciones destructivas e irreversibles. Lee dos veces antes de proceder.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-white p-5">
                  <div>
                    <p className="font-bold text-slate-900">Desactivar cuenta temporalmente</p>
                    <p className="text-xs font-semibold text-slate-500">
                      Tus rifas salen de la página principal, pero tus datos y números se conservan 12 meses.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 !border-rose-400 !text-rose-600 hover:!bg-rose-50 font-bold px-5"
                  >
                    Desactivar cuenta
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-300 bg-gradient-to-br from-rose-100/60 to-white p-5">
                  <div>
                    <p className="font-bold text-rose-900 flex items-center gap-1.5">
                      <Trash2 className="h-4 w-4" />
                      Eliminar cuenta PERMANENTEMENTE
                    </p>
                    <p className="text-xs font-semibold text-rose-700/80">
                      Borra TODOS tus datos: rifas, reservas, tickets, pagos, wallet y notificaciones. No hay vuelta atrás.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="h-12 !bg-gradient-to-r from-rose-600 to-rose-800 !text-white font-black shadow-lg shadow-rose-900/20"
                  >
                    <Trash2 className="mr-1.5 h-4.5 w-4.5" />
                    Sí, eliminar mi cuenta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
