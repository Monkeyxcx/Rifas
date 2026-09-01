import Link from "next/link";
import { Ticket, Search, Plus, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/rifas", label: "Rifas activas", icon: Ticket },
  { href: "/rifas?solidarias=true", label: "Solidarias", icon: Heart },
  { href: "/buscar", label: "Buscar", icon: Search }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="container max-w-content flex h-16 items-center justify-between gap-4">
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
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-rose transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/ingresar">
              <User className="h-4 w-4" />
              Ingresar
            </Link>
          </Button>
          <Button asChild variant="default" size="sm">
            <Link href="/rifas/crear">
              <Plus className="h-4 w-4" />
              Crear rifa
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
