"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CreditCard, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import NumberGrid from "@/components/rifas/NumberGrid";
import { cn, formatCurrency } from "@/lib/utils";

interface Props {
  rifaId: string;
  isSolidarity: boolean;
  titleHeader: string;
  numberPrice: number;
  totalNumbers: number;
  soldNumbers: Set<string>;
  mineNumbers: Set<string>;
  availableCount: number;
  soldPercentage: number;
  soldOut: boolean;
}

export default function RifaDetailActions(props: Props) {
  const {
    rifaId,
    isSolidarity,
    titleHeader,
    numberPrice,
    totalNumbers,
    soldNumbers,
    mineNumbers,
    availableCount,
    soldPercentage,
    soldOut
  } = props;

  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const subtotal = selected.length * numberPrice;
  const fee = Math.round(subtotal * 0.03);
  const total = subtotal + fee;

  const reserveAndPay = async () => {
    if (loading) return;
    if (selected.length === 0) {
      alert("Selecciona al menos un número para reservar.");
      return;
    }

    const currentPath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : `/rifas/${rifaId}`;

    setLoading(true);
    try {
      const authProbe = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include"
      }).catch(() => ({ ok: false }));
      if (!authProbe.ok) {
        const redirectLogin =
          "/auth?redirectTo=" + encodeURIComponent(currentPath);
        window.location.replace(redirectLogin);
        return;
      }

      const r = await fetch("/api/reservar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rifa_id: rifaId, numbers: selected })
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(
          `Error al reservar: ${body.error ?? "Intenta en 30 segundos."}`
        );
        return;
      }
      const reservaId: string =
        body.reserva_id ??
        `RES-${Date.now().toString(36).toUpperCase()}`;
      router.push(
        `/checkout/${reservaId}?rifa_id=${encodeURIComponent(
          rifaId
        )}&numbers=${encodeURIComponent(selected.join(","))}`
      );
    } catch (e) {
      console.error(e);
      alert("Error de conexión. Revisa tu internet e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NumberGrid
        totalNumbers={totalNumbers}
        numberPrice={numberPrice}
        soldNumbers={soldNumbers}
        mineNumbers={mineNumbers}
        soldPercentage={soldPercentage}
        maxSelections={20}
        onChange={(sel) => setSelected(sel)}
      />
      <aside className="lg:col-span-2 space-y-4 lg:sticky lg:top-24 self-start">
        <Card className="border border-slate-200 overflow-hidden shadow-[0_16px_50px_-24px_rgba(15,23,42,0.15)]">
          <div
            className={cn(
              "px-5 py-4",
              isSolidarity
                ? "bg-gradient-to-r from-brand-cyan to-brand-rose text-white"
                : "bg-gradient-to-r from-brand-rose to-brand-violet text-white"
            )}
          >
            <div className="text-[11px] uppercase tracking-[0.2em] opacity-85 font-bold">
              {titleHeader}
            </div>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] opacity-80 font-semibold">
                  Precio por número
                </div>
                <div className="font-display font-black text-3xl leading-none tabular-nums">
                  {formatCurrency(numberPrice)}
                </div>
              </div>
              <Badge
                variant="secondary"
                className="!bg-white/20 !text-white !border-white/30 !border backdrop-blur"
              >
                ⚡ {availableCount} disponibles
              </Badge>
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Avance de venta</span>
                <span className="font-numbers tabular-nums font-bold text-slate-700">
                  {soldPercentage}%
                </span>
              </div>
              <Progress
                value={soldPercentage}
                className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-rose [&>div]:to-brand-violet [&>div]:rounded-full"
              />
              <div className="text-[11px] text-slate-400 font-numbers tabular-nums">
                {totalNumbers - availableCount} vendidos · {availableCount}{" "}
                disponibles · {totalNumbers} total
              </div>
            </div>

            <Separator />

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                Tu carrito
              </div>
              {selected.length === 0 ? (
                <div className="text-xs text-slate-400 italic">
                  Aún no has seleccionado ningún número. Clic en la cuadrícula.
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {selected.map((n) => (
                    <Badge
                      key={n}
                      variant="active"
                      className="px-2.5 py-0.5 text-xs font-numbers tabular-nums"
                    >
                      {n}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                    Subtotal ({selected.length || 0}{" "}
                    {selected.length === 1 ? "núm." : "núms."})
                  </div>
                  <div className="font-display font-black text-2xl tabular-nums text-slate-900">
                    {formatCurrency(subtotal)}
                  </div>
                  {fee > 0 && (
                    <div className="text-[11px] text-slate-400">
                      + plataforma {formatCurrency(fee)} =
                      <span className="ml-1 font-bold text-slate-700">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="!border-emerald-200 !bg-emerald-50 !text-emerald-700 shrink-0"
                >
                  <ShieldCheck className="h-3 w-3 mr-1" /> Pago seguro
                </Badge>
              </div>
            </div>

            <Button
              type="button"
              disabled={soldOut || loading || selected.length === 0}
              onClick={reserveAndPay}
              className={cn(
                "w-full h-12 text-base font-bold rounded-xl shadow-cta active:scale-[0.98]",
                soldOut
                  ? "!bg-slate-300 !text-slate-500"
                  : "!bg-gradient-to-r from-brand-rose to-brand-violet !text-white"
              )}
            >
              {soldOut ? (
                <>Todos los números vendidos — agotada</>
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reservando tus números…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Reservar y pagar · Mercado Pago
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                🔒 SSL encriptado
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end">
                ⏱ Reserva 15 min
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-dashed border-slate-200 bg-slate-50/60">
          <CardContent className="p-4 text-xs space-y-2">
            <div className="font-semibold text-slate-700 flex items-center gap-2">
              🛡️ Nuestros 4 niveles anti-doble venta
            </div>
            <ol className="space-y-1 text-slate-500 list-decimal list-inside">
              <li>Bloqueo inmediato UI al hacer clic</li>
              <li>Transacción SERVIDOR con Row Lock</li>
              <li>RPC `buy_reservations` FOR UPDATE</li>
              <li>Unique Index parcial Postgres</li>
            </ol>
          </CardContent>
        </Card>
      </aside>
    </>
  );
}
