"use client";

import Link from "next/link";
import {
  Menu,
  Ticket,
  Search,
  Plus,
  Heart,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthMenu } from "@/components/layout/AuthMenu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/rifas", label: "Rifas activas", icon: Ticket },
  { href: "/rifas?tab=solidarity", label: "Solidarias", icon: Heart }
];

const MOBILE_EXTRA = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/rifas", label: "Buscar rifas", icon: Search }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="container max-w-content flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
          aria-label="RifasCenter — Inicio"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-cta shadow-cta text-white transition-transform group-hover:scale-105">
            <Ticket className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Rifas
            <span className="text-brand-rose">Center</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href + label}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-rose transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="sm:hidden">
            <MobileDrawerSheet />
          </div>

          <div className="hidden sm:block">
            <AuthMenu />
          </div>
          <div className="sm:hidden">
            <MobileMiniAuth />
          </div>

          <Button asChild variant="default" size="sm">
            <Link href="/rifas/crear">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Crear rifa</span>
              <span className="sm:hidden">Crear</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function MobileMiniAuth() {
  return (
    <Button asChild variant="outline" size="sm" className="h-9 px-2.5">
      <Link href="/auth" aria-label="Iniciar sesión">
        <Ticket className="h-4 w-4" />
      </Link>
    </Button>
  );
}

function MobileDrawerSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-4.5 w-4.5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88%] sm:max-w-sm flex flex-col p-0 gap-0">
        <SheetHeader className="border-b border-slate-200/80">
          <SheetTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-cta text-white shadow-cta">
              <Ticket className="h-4.5 w-4.5" strokeWidth={2.5} />
            </span>
            RifasCenter
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Navegación
            </div>
            {[...MOBILE_EXTRA, ...NAV_LINKS].map(({ href, label, icon: Icon }) => (
              <Link
                key={href + label}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-brand-rose font-semibold"
              >
                <Icon className="h-4.5 w-4.5 text-slate-500" />
                {label}
              </Link>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Mi cuenta
            </div>
            <AuthMenu verticalStack />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
