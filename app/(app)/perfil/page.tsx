import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  CalendarClock,
  CreditCard,
  FileText,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  NotebookPen,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Wallet,
  PartyPopper,
  Clock3,
  Trophy,
  Gift,
  Sparkles,
  Plus,
  Settings2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";
import { ProfileSignOutButton } from "@/components/profile/ProfileSignOutButton";
import { ProfileSaveForm } from "@/components/profile/ProfileSaveForm";

export const revalidate = 0;

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

const navItems: NavItem[] = [
  { id: "datos", label: "Datos personales", icon: Settings2, active: true },
  { id: "seguridad", label: "Seguridad y acceso", icon: KeyRound },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "facturacion", label: "Facturación y pagos", icon: CreditCard },
  { id: "peligro", label: "Zona peligrosa", icon: ShieldAlert }
];

async function getCurrentPerfil(): Promise<{
  user: { id: string; email: string };
  perfil: Perfil;
  statsCreador: { creadas: number; vendidos: number; recaudado: number };
  statsParticipante: {
    tickets: number;
    numerosComprados: number;
    invertido: number;
    ganados: number;
  };
} | null> {
  try {
    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return null;
    }
    const user = userData.user;

    const { data: profileRow, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr || !profileRow) {
      return null;
    }
    const perfil = profileRow as unknown as Perfil;

    const { data: creadasRows, error: crErr } = await supabase
      .from("rifas")
      .select("id,number_price,total_numbers,available_numbers")
      .eq("creator_id", user.id);
    let creadas = 0;
    let vendidos = 0;
    let recaudado = 0;
    if (!crErr && creadasRows) {
      creadas = creadasRows.length;
      for (const r of creadasRows as Array<{
        number_price: number;
        total_numbers: number;
        available_numbers: number;
      }>) {
        const s = Number(r.total_numbers || 0) - Number(r.available_numbers || 0);
        vendidos += Math.max(0, s);
        recaudado += Math.max(0, s) * Number(r.number_price || 0);
      }
    }

    const { data: partRows, error: partErr } = await supabase
      .from("reservas")
      .select("rifa_id,number,status,rifa:rifas(number_price)")
      .eq("user_id", user.id)
      .in("status", ["reserved", "paid"]);
    let tickets = 0;
    let numerosComprados = 0;
    let invertido = 0;
    const rifaKeys = new Set<string>();
    if (!partErr && partRows) {
      for (const p of partRows as Array<{
        rifa_id: string;
        number: string;
        status: string;
        rifa?: { number_price: number } | null;
      }>) {
        rifaKeys.add(p.rifa_id);
        if (p.status === "paid" || p.status === "reserved") {
          numerosComprados += 1;
          invertido += Number(p.rifa?.number_price || 0);
        }
      }
      tickets = rifaKeys.size;
    }

    const statsCreador = {
      creadas,
      vendidos,
      recaudado
    };
    const statsParticipante = {
      tickets,
      numerosComprados,
      invertido,
      ganados: 0
    };
    return {
      user: { id: user.id, email: user.email ?? "usuario@rifascenter.com" },
      perfil,
      statsCreador,
      statsParticipante
    };
  } catch (e) {
    console.error("[perfil page] load failed", e);
    return null;
  }
}

export default async function PerfilPage() {
  const loaded = await getCurrentPerfil();
  if (!loaded) redirect("/auth?redirectTo=%2Fperfil");
  const { user, perfil, statsCreador, statsParticipante } = loaded;

  const displayName = perfil.display_name ?? perfil.full_name ?? user.email.split("@")[0] ?? "Usuario";
  const fullName = perfil.full_name ?? displayName;
  const initials = fullName
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
                {perfil.is_verified && (
                  <BadgeCheck className="absolute -bottom-1 -right-1 h-8 w-8 text-emerald-400 drop-shadow" strokeWidth={2.4} />
                )}
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-black tracking-tight lg:text-3xl">
                    ¡Hola, {displayName}! 👋
                  </h1>
                  {perfil.is_verified && (
                    <Badge className="!bg-white/95 !text-emerald-600 !border-0 shadow text-[11px]">
                      <BadgeCheck className="mr-1 h-3 w-3" />
                      Verificado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-white/85 lg:text-base">
                  <Mail className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5" />
                  {user.email}
                  <span className="mx-2 opacity-60">·</span>
                  <MapPin className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5" />
                  {perfil.country || "Sin país registrado"}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  <CalendarClock className="mr-1 inline h-3 w-3 -translate-y-0.5" />
                  Miembro desde{" "}
                  {new Date(perfil.created_at).toLocaleDateString("es-CO", {
                    month: "long",
                    year: "numeric"
                  })}
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
                    {formatCurrency(perfil.wallet_balance || 0)}
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
                  {formatCurrency(perfil.wallet_balance || 0)}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Última actualización ·{" "}
                  {new Date(perfil.updated_at).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    size="sm"
                    className="h-9 !bg-gradient-to-r from-emerald-500 to-brand-cyan !text-white font-bold"
                    disabled
                  >
                    <CreditCard className="mr-1 h-3.5 w-3.5" />
                    Recargar (pronto)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 !border-emerald-200 !text-emerald-700 font-bold"
                    disabled
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
                    <Gift className="mr-2 h-4 w-4 text-brand-violet" /> Mis rifas creadas
                  </Link>
                </Button>
                <Button asChild variant="outline" className="!h-10 justify-start !border-slate-200 !text-slate-700 font-bold">
                  <Link href="/mis-rifas/participando">
                    <PartyPopper className="mr-2 h-4 w-4 text-brand-cyan" /> Mis participaciones
                  </Link>
                </Button>
                <Button asChild variant="outline" className="!h-10 justify-start !border-slate-200 !text-slate-700 font-bold">
                  <Link href="/rifas/crear">
                    <Plus className="mr-2 h-4 w-4 text-brand-rose" /> Crear rifa nueva
                  </Link>
                </Button>
                <Separator className="my-1" />
                <ProfileSignOutButton />
              </CardContent>
            </Card>

            <Card className="border-dashed border-slate-200 bg-gradient-to-br from-slate-50/60 via-white to-slate-50">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Trophy className="h-4 w-4 text-brand-gold" />
                  Estadísticas
                </div>
                <ul className="space-y-1.5 text-slate-600">
                  <li className="flex justify-between">
                    <span className="text-slate-500">Invertido total</span>
                    <span className="font-bold tabular-nums text-slate-800">
                      {formatCurrency(statsParticipante.invertido)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Recaudado como creador</span>
                    <span className="font-bold tabular-nums text-slate-800">
                      {formatCurrency(statsCreador.recaudado)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Números comprados</span>
                    <span className="font-bold tabular-nums text-slate-800">
                      {statsParticipante.numerosComprados}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Premios ganados</span>
                    <span className="font-bold tabular-nums text-slate-800">
                      {statsParticipante.ganados}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </aside>

          {/* MAIN CONTENT · 5 SECTIONS */}
          <section className="space-y-6">
            {/* 1 · DATOS PERSONALES */}
            <ProfileSaveForm perfil={perfil} email={user.email} />

            {/* 2 · SEGURIDAD */}
            <Card id="seguridad" className="border-slate-200 shadow-sm scroll-mt-24">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                    <KeyRound className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg">Seguridad y acceso</CardTitle>
                    <CardDescription>
                      Gestiona tu contraseña y dispositivos conectados.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline" className="justify-start h-11 !border-slate-200" disabled>
                    <KeyRound className="mr-2 h-4 w-4 text-slate-500" />
                    Cambiar contraseña (próximamente)
                  </Button>
                  <Button variant="outline" className="justify-start h-11 !border-slate-200" disabled>
                    <ShieldCheck className="mr-2 h-4 w-4 text-slate-500" />
                    Dispositivos conectados (próximamente)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 3 · NOTIFICACIONES */}
            <Card id="notificaciones" className="border-slate-200 shadow-sm scroll-mt-24">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-cyan to-sky-500 text-white">
                    <Bell className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg">Notificaciones</CardTitle>
                    <CardDescription>
                      Elige por dónde quieres que te avisemos de sorteos, pagos y rifas que sigues.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: Mail, t: "Notificaciones por email", d: "Pagos, rifas ganadas, recordatorios" },
                  { icon: Sparkles, t: "Anuncios de nuevas rifas premium", d: "Una vez por semana máximo" },
                  { icon: Clock3, t: "Recordatorios de cierre de venta", d: "Rifas creadas por ti cuando queden < 48h" }
                ].map((row) => (
                  <div key={row.t} className="flex items-start justify-between gap-4 rounded-xl p-4 hover:bg-slate-50 transition">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                        <row.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm">{row.t}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{row.d}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 !border-slate-200 !text-slate-500">Pronto</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 4 · FACTURACION */}
            <Card id="facturacion" className="border-slate-200 shadow-sm scroll-mt-24">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-gold to-amber-500 text-white">
                    <CreditCard className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg">Facturación y pagos</CardTitle>
                    <CardDescription>
                      Información fiscal y métodos de pago.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline" className="justify-start h-11 !border-slate-200" disabled>
                    <Globe className="mr-2 h-4 w-4 text-slate-500" />
                    Datos fiscales (próximamente)
                  </Button>
                  <Button variant="outline" className="justify-start h-11 !border-slate-200" disabled>
                    <FileText className="mr-2 h-4 w-4 text-slate-500" />
                    Historial de pagos (próximamente)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 5 · ZONA PELIGROSA */}
            <Card id="peligro" className="border-rose-200 shadow-sm bg-rose-50/30 scroll-mt-24">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white">
                    <ShieldAlert className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg text-rose-900">Zona peligrosa</CardTitle>
                    <CardDescription className="text-rose-800/80">
                      Acciones irreversibles. Asegúrate antes de confirmar.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl border border-dashed border-rose-300 bg-white/70 p-4">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 text-sm">Anonimizar mi cuenta</div>
                    <div className="text-xs text-slate-500">
                      Elimina todos tus datos personales manteniendo el historial de rifas públicas.
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" disabled>
                    Solicitar anonimización (pronto)
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
