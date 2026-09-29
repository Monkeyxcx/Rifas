import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  Gift,
  Mail,
  MapPin,
  NotebookPen,
  PartyPopper,
  Plus,
  ShieldCheck,
  Ticket,
  Wallet
} from "lucide-react";
import type { UserNequiVerification } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";
import { ProfileSignOutButton } from "@/components/profile/ProfileSignOutButton";
import { ProfileSettingsTabs } from "@/components/profile/ProfileSettingsTabs";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
  latestNequiVerification: UserNequiVerification | null;
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
      .select("rifa_id,number,status,expires_at,rifa:rifas(number_price)")
      .eq("user_id", user.id)
      .in("status", ["reserved", "paid"]);
    let tickets = 0;
    let numerosComprados = 0;
    let invertido = 0;
    const rifaKeys = new Set<string>();
    if (!partErr && partRows) {
      const now = new Date();
      for (const p of partRows as Array<{
        rifa_id: string;
        number: string;
        status: string;
        expires_at?: string | null;
        rifa?: { number_price: number } | null;
      }>) {
        const esPaid = p.status === "paid";
        const esReservedValido =
          p.status === "reserved" &&
          !!p.expires_at &&
          new Date(p.expires_at) > now;
        if (!esPaid && !esReservedValido) continue;
        rifaKeys.add(p.rifa_id);
        numerosComprados += 1;
        invertido += Number(p.rifa?.number_price || 0);
      }
      tickets = rifaKeys.size;
    }

    const statsCreador = { creadas, vendidos, recaudado };
    const statsParticipante = {
      tickets,
      numerosComprados,
      invertido,
      ganados: 0
    };

    let latestNequiVerification: UserNequiVerification | null = null;
    const { data: nequiRows, error: nequiErr } = await supabase
      .from("user_nequi_verifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!nequiErr && nequiRows && nequiRows.length) {
      latestNequiVerification = nequiRows[0] as unknown as UserNequiVerification;
    }

    return {
      user: { id: user.id, email: user.email ?? "usuario@rifascenter.com" },
      perfil,
      statsCreador,
      statsParticipante,
      latestNequiVerification
    };
  } catch (e) {
    console.error("[perfil page] load failed", e);
    return null;
  }
}

export default async function PerfilPage() {
  const loaded = await getCurrentPerfil();
  if (!loaded) redirect("/auth?redirectTo=%2Fperfil");
  const {
    user,
    perfil,
    statsCreador,
    statsParticipante,
    latestNequiVerification
  } = loaded;

  const displayName =
    perfil.display_name ?? perfil.full_name ?? user.email.split("@")[0] ?? "Usuario";
  const fullName = perfil.full_name ?? displayName;
  const initials =
    fullName
      ?.split(" ")
      .filter((_, i, a) => i === 0 || i === a.length - 1)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") ?? "UD";

  const stats = [
    { icon: Ticket, label: "Tickets", value: String(statsParticipante.tickets) },
    { icon: PartyPopper, label: "Rifas creadas", value: String(statsCreador.creadas) },
    {
      icon: Wallet,
      label: "Saldo wallet",
      value: formatCurrency(perfil.wallet_balance || 0)
    },
    { icon: NotebookPen, label: "Números vendidos", value: String(statsCreador.vendidos) }
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="container mx-auto max-w-5xl px-4 py-8 lg:py-10">
        {/* Header calm */}
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-xl font-black text-slate-700 ring-1 ring-slate-200">
                  {initials}
                </div>
                {perfil.is_verified && (
                  <BadgeCheck
                    className="absolute -bottom-1 -right-1 h-6 w-6 text-emerald-500"
                    strokeWidth={2.2}
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                    {displayName}
                  </h1>
                  {perfil.is_verified && (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700"
                    >
                      Verificado
                    </Badge>
                  )}
                </div>
                <p className="truncate text-sm text-slate-500">
                  <Mail className="mr-1 inline h-3.5 w-3.5 -translate-y-px" />
                  {user.email}
                  <span className="mx-2 text-slate-300">·</span>
                  <MapPin className="mr-1 inline h-3.5 w-3.5 -translate-y-px" />
                  {perfil.country || "Sin país"}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  <CalendarClock className="mr-1 inline h-3 w-3 -translate-y-px" />
                  Miembro desde{" "}
                  {new Date(perfil.created_at).toLocaleDateString("es-CO", {
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="border-slate-200">
                <Link href="/mis-rifas/creadas">
                  <Gift className="mr-1.5 h-3.5 w-3.5" /> Mis rifas
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-slate-200">
                <Link href="/rifas/crear">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Crear rifa
                </Link>
              </Button>
              {perfil.is_admin ? (
                <Button asChild variant="outline" size="sm" className="border-slate-200">
                  <Link href="/admin/verificaciones-nequi">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Admin
                  </Link>
                </Button>
              ) : null}
              <ProfileSignOutButton />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3"
              >
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
                <p className="font-numbers text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>
              Invertido:{" "}
              <strong className="font-semibold text-slate-700">
                {formatCurrency(statsParticipante.invertido)}
              </strong>
            </span>
            <span>
              Recaudado:{" "}
              <strong className="font-semibold text-slate-700">
                {formatCurrency(statsCreador.recaudado)}
              </strong>
            </span>
            <span>
              Números comprados:{" "}
              <strong className="font-semibold text-slate-700">
                {statsParticipante.numerosComprados}
              </strong>
            </span>
          </div>
        </header>

        <ProfileSettingsTabs
          perfil={perfil}
          email={user.email}
          userId={user.id}
          latestNequiVerification={latestNequiVerification}
        />
      </div>
    </main>
  );
}
