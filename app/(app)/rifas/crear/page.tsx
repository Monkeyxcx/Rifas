import CreatorForm from "@/components/rifas/CreatorForm";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Sparkles, Edit3 } from "lucide-react";

export const metadata = {
  title: "Crear tu rifa · RifasCenter",
  description:
    "Crea una rifa en 4 pasos: premio o causa solidaria, números, fechas y listo."
};

type PageProps = {
  searchParams: Promise<{ editar?: string }>;
};

export default async function CrearRifaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const editingId = sp?.editar?.trim() || null;
  const isEditing = Boolean(editingId);

  return (
    <div className="relative">
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-brand-rose/10 via-white to-brand-violet/10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgb(255_27_81_/_0.15)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="container relative max-w-content py-10">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/rifas" className="hover:text-brand-rose transition">
              Rifas activas
            </Link>
            <span className="text-slate-300">/</span>
            {isEditing ? (
              <>
                <Link
                  href="/mis-rifas/creadas"
                  className="hover:text-brand-rose transition"
                >
                  Mis rifas creadas
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-slate-800 font-medium">Editar rifa</span>
              </>
            ) : (
              <span className="text-slate-800 font-medium">Crear rifa</span>
            )}
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isEditing ? (
              <Badge
                variant="outline"
                className="!border-violet-200 !bg-white/70 !text-brand-violet hover:!bg-white"
              >
                <Edit3 className="h-3 w-3 mr-1.5" />
                Modo edición · Modifica tu rifa
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="!border-rose-200 !bg-white/70 !text-brand-rose hover:!bg-white"
              >
                <Sparkles className="h-3 w-3 mr-1.5" />
                Beta · Crea tu primera rifa ¡gratis!
              </Badge>
            )}
            <Badge variant="secondary" className="!bg-slate-100 !text-slate-600">
              ⚡ 4 pasos · ~2 minutos
            </Badge>
          </div>

          {isEditing ? (
            <>
              <h1 className="mt-4 font-display font-black text-3xl md:text-4xl text-slate-900 leading-[1.05] max-w-3xl">
                Edita tu rifa y{" "}
                <span className="bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent">
                  mejora sus chances
                </span>{" "}
                de vender más
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600 text-sm md:text-base leading-relaxed">
                Ajusta el título, sube la foto real del premio, corrige fechas o cambia el
                precio por número. Los números ya vendidos y las reservas en curso se mantienen intactas.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-4 font-display font-black text-3xl md:text-4xl text-slate-900 leading-[1.05] max-w-3xl">
                Crea una rifa para un{" "}
                <span className="bg-gradient-to-r from-brand-rose to-brand-violet bg-clip-text text-transparent">
                  premio increíble
                </span>{" "}
                o una{" "}
                <span className="bg-gradient-to-r from-brand-cyan to-brand-rose bg-clip-text text-transparent">
                  causa solidaria
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600 text-sm md:text-base leading-relaxed">
                Tú eliges el premio, cuántos números (entre 10 y 100), cuánto cuesta cada
                uno y cuándo se sortea. Nosotros nos encargamos de pagos seguros con
                Mercado Pago, transparencia y anti-doble-reserva.
              </p>
            </>
          )}

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            {[
              { icon: "🔒", t: "Pago seguro", d: "Mercado Pago" },
              { icon: "🛡️", t: "Anti doble venta", d: "4 capas" },
              { icon: "⚡", t: "En minutos", d: "Listo rápido" },
              { icon: "💝", t: "Solidarias", d: "Causas reales" }
            ].map((f) => (
              <div
                key={f.t}
                className="rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm p-3 shadow-[0_4px_18px_-10px_rgba(255,27,81,0.18)]"
              >
                <div className="text-xl leading-none">{f.icon}</div>
                <div className="mt-1.5 text-[12px] font-bold text-slate-800 leading-none">
                  {f.t}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-content py-10">
        <CreatorForm editingId={editingId} />
      </div>
    </div>
  );
}
