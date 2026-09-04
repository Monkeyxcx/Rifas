import Link from "next/link";
import { Ticket, Heart, Gift, Instagram, Facebook, Twitter } from "lucide-react";

const FOOTER_COLS = [
  {
    title: "Plataforma",
    links: [
      { label: "Rifas activas", href: "/rifas" },
      { label: "Rifas solidarias", href: "/rifas?tab=solidarias" },
      { label: "Cómo funciona", href: "/como-funciona", placeholder: true },
      { label: "Historial de ganadores", href: "/ganadores", placeholder: true }
    ]
  },
  {
    title: "Para creadores",
    links: [
      { label: "Crea tu rifa", href: "/rifas/crear" },
      { label: "Tarifas y comisiones", href: "/tarifas", placeholder: true },
      { label: "Soporte", href: "/soporte", placeholder: true },
      { label: "API & Developers", href: "/developers", placeholder: true }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y condiciones", href: "/terminos", placeholder: true },
      { label: "Política de privacidad", href: "/privacidad", placeholder: true },
      { label: "Política de reembolsos", href: "/reembolsos", placeholder: true },
      { label: "Reglamento de sorteos", href: "/reglamento", placeholder: true }
    ]
  }
];

const SOCIAL = [
  { icon: Instagram, href: "#", label: "Instagram RifasCenter" },
  { icon: Facebook, href: "#", label: "Facebook RifasCenter" },
  { icon: Twitter, href: "#", label: "X / Twitter RifasCenter" }
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="container max-w-content py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-cta shadow-cta text-white">
                <Ticket className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="font-display text-xl font-extrabold">
                Rifas<span className="text-brand-rose">Center</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Plataforma oficial de rifas digitales. Participa por premios increíbles o crea la tuya. 100% transparente, seguro y sin letras pequeñas.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="badge-solidarity"><Heart className="h-3 w-3" /> Apoyamos causas sociales</span>
              <span className="badge-prize"><Gift className="h-3 w-3" /> +100 premios mensuales</span>
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => {
                  const isPlaceholder = (link as { placeholder?: boolean }).placeholder === true;
                  if (isPlaceholder) {
                    return (
                      <li key={link.href}>
                    <span
                      title="Próximamente"
                      className="group relative inline-flex items-center gap-1 text-sm text-slate-400 cursor-not-allowed select-none"
                    >
                      {link.label}
                      <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Pronto
                      </span>
                    </span>
                  </li>
                    );
                  }
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-500 hover:text-brand-rose transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
              Síguenos
            </h4>
            <div className="flex items-center gap-2">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 hover:text-white hover:bg-brand-rose hover:border-brand-rose transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} RifasCenter · Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-400">
            Hecho con ❤️ en LATAM. Plataforma regulada según normativa local de sorteos.
          </p>
        </div>
      </div>
    </footer>
  );
}
