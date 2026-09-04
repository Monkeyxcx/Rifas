"use client";

import Link from "next/link";
import {
  UserRound,
  LogOut,
  Ticket,
  Gift,
  Plus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useAuthSession } from "@/hooks/useAuthSession";
import { cn, formatCurrency } from "@/lib/utils";

interface Props {
  verticalStack?: boolean;
}

export function AuthMenu({ verticalStack = false }: Props) {
  const { user, profile, loading, signOut } = useAuthSession();

  if (verticalStack) {
    return (
      <div className="space-y-2 w-full">
        {loading ? (
          <Button variant="outline" size="sm" disabled className="w-full justify-start">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando cuenta…
          </Button>
        ) : !user ? (
          <Button asChild variant="gradient" size="sm" className="w-full justify-start">
            <Link href="/auth">
              <UserRound className="h-4 w-4" />
              Iniciar sesión / Registrarme
            </Link>
          </Button>
        ) : (
          <>
            <div className="rounded-2xl bg-gradient-cta text-white p-4 flex items-center gap-3 shadow-cta">
              <span
                aria-hidden
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-white/40 text-base font-black"
              >
                {(
                  (profile?.display_name ?? undefined)
                    ?.split(" ")
                    .map((s: string) => s[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() ??
                  user.email?.slice(0, 2).toUpperCase() ??
                  "R"
                )}
              </span>
              <div className="min-w-0">
                <div className="font-display font-black text-base truncate">
                  {profile?.display_name ??
                    (user.email ? user.email.split("@")[0] : "Mi cuenta")}
                </div>
                <div className="text-xs text-white/80 truncate break-all">
                  {user.email}
                </div>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/perfil">
                <UserRound className="h-4 w-4 text-brand-rose" />
                Mi perfil
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/mis-rifas/participando">
                <Ticket className="h-4 w-4 text-brand-cyan" />
                Mis números
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/mis-rifas/creadas">
                <Gift className="h-4 w-4 text-brand-violet" />
                Rifas creadas
              </Link>
            </Button>
            <Button asChild variant="gradient" className="w-full justify-start">
              <Link href="/rifas/crear">
                <Plus className="h-4 w-4" />
                Crear rifa nueva
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
        <Link href="/auth">
          <UserRound className="h-4 w-4" />
          Ingresar
        </Link>
      </Button>
    );
  }

  const initials =
    (profile?.display_name ?? undefined)
      ?.split(" ")
      .map((s: string) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ??
    user.email
      ?.slice(0, 2)
      .toUpperCase() ??
    "R";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          aria-label="Menú usuario"
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1.5 pr-3 py-1.5 shadow-sm hover:border-brand-rose/40 hover:shadow-md transition-all group"
        >
          <span
            aria-hidden
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
              "bg-gradient-to-br from-brand-rose via-fuchsia-500 to-brand-violet shadow-sm"
            )}
          >
            {initials}
          </span>
          <span className="text-sm font-semibold text-slate-800 max-w-[140px] truncate">
            {profile?.display_name ??
              (user.email ? user.email.split("@")[0] : "Mi cuenta")}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-slate-200">
        <div className="relative h-24 bg-gradient-cta">
          <div
            aria-hidden
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, white 1.5px, transparent 1.5px)",
              backgroundSize: "14px 14px"
            }}
          />
          <span
            aria-hidden
            className="absolute left-5 -bottom-8 grid h-16 w-16 place-items-center rounded-2xl border-4 border-white text-lg font-black text-white shadow-lg bg-gradient-cta"
          >
            {initials}
          </span>
        </div>

        <div className="pt-11 px-5 pb-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {profile?.display_name ??
                (user.email ? user.email.split("@")[0] : "Mi cuenta")}
            </DialogTitle>
            <DialogDescription className="break-all">
              {user.email}
            </DialogDescription>
          </DialogHeader>

          {profile && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Saldo
                </div>
                <div className="mt-0.5 font-display font-bold text-slate-900 text-base">
                  {formatCurrency(profile.wallet_balance ?? 0)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Creadas
                </div>
                <div className="mt-0.5 font-display font-bold text-slate-900 text-base">
                  {(profile as { created_owned_count?: number })
                    .created_owned_count ?? 0}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Ganadas
                </div>
                <div className="mt-0.5 font-display font-bold text-slate-900 text-base">
                  {(profile as { won_count?: number }).won_count ?? 0}
                </div>
              </div>
            </div>
          )}

          <nav className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/perfil">
                <UserRound className="h-4 w-4 text-brand-rose" />
                Mi perfil
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/mis-rifas/participando">
                <Ticket className="h-4 w-4 text-brand-cyan" />
                Mis números
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/mis-rifas/creadas">
                <Gift className="h-4 w-4 text-brand-violet" />
                Rifas creadas
              </Link>
            </Button>
            <Button asChild variant="gradient" className="justify-start">
              <Link href="/rifas/crear">
                <Plus className="h-4 w-4" />
                Crear rifa
              </Link>
            </Button>
          </nav>

          <DialogFooter className="mt-6 pt-5 border-t border-slate-200/80">
            <Button
              variant="ghost"
              className="text-slate-600 hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
