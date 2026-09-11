"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CreditCard, Loader2 } from "lucide-react";
import { showError, showWarning } from "@/lib/ui/modals";

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
      void showWarning({
        title: "Selecciona números",
        message: "Elige al menos un número de la cuadrícula para continuar con la reserva."
      });
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
      }).catch(() => ({ ok: false } as Response));
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
        // FIX B#11: /api/reservar retorna {ok:false, error:"..."}. Campo correcto
        // es body.error, no body.mensaje. El mensaje conflict details con el
        // número exacto que falló viene en failed_number, también lo adjuntamos.
        const failedNum = body.failed_number ? ` (número ${body.failed_number})` : "";
        const msg =
          body.conflict === true
            ? (body.error ??
               `Algunos números ya fueron reservados. Actualiza y vuelve a elegir.`) + failedNum
            : body.error ?? "Intenta nuevamente en 30 segundos.";
        void showError({
          title: r.status === 409 ? "Números no disponibles" : "No se pudo reservar",
          message: msg
        });
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
      void showError({
        title: "Error de conexión",
        message: "Sin conexión al servidor. Revisa tu internet e intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const numberGrid = (
    <NumberGrid
      totalNumbers={totalNumbers}
      numberPrice={numberPrice}
      soldNumbers={soldNumbers}
      mineNumbers={mineNumbers}
      maxSelections={20}
      onChange={(sel) => setSelected(sel)}
    />
  );

  const paymentAside = (
    <aside className="space-y-4 lg:sticky lg:top-24 self-start">
      <Card className="border border-slate-200 overflow-hidden shadow-[0_16px_50px_-24px_rgba(15,23,42,0.15)]">
        <div
          className={cn(
            "px-4 py-3 sm:px-5 sm:py-4",
            isSolidarity
              ? "bg-gradient-to-r from-brand-cyan to-brand-rose text-white"
              : "bg-gradient-to-r from-brand-rose to-brand-violet text-white"
          )}
        >
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] opacity-85 font-bold">
            {titleHeader}
          </div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] sm:text-[11px] opacity-80 font-semibold">
                Precio por número
              </div>
              <div className="font-display font-black text-2xl sm:text-3xl leading-none tabular-nums">
                {formatCurrency(numberPrice)}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="!bg-white/20 !text-white !border-white/30 !border backdrop-blur !text-[11px]"
            >
              ⚡ {availableCount} disp.
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium">
              <span>Venta</span>
              <span className="font-numbers tabular-nums font-bold text-slate-700">
                {soldPercentage}%
              </span>
            </div>
            <Progress
              value={soldPercentage}
              className="h-2 sm:h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-brand-rose [&>div]:to-brand-violet [&>div]:rounded-full"
            />
          </div>

          <Separator />

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                Selección ({selected.length || 0})
              </div>
              <Badge
                variant="outline"
                className="!border-emerald-200 !bg-emerald-50 !text-emerald-700 !text-[10px] sm:!text-[11px] shrink-0 py-0"
              >
                <ShieldCheck className="h-3 w-3 mr-1" /> Pago seguro
              </Badge>
            </div>
            {selected.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-1">
                Elige números para continuar.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {selected.map((n) => (
                  <Badge
                    key={n}
                    variant="active"
                    className="px-2 py-0.5 text-[11px] sm:text-xs font-numbers tabular-nums"
                  >
                    {n}
                  </Badge>
                ))}
              </div>
            )}
            <div className="space-y-0.5 pt-1 border-t border-slate-200/70">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Subtotal</span>
                <span className="font-numbers tabular-nums font-semibold text-slate-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {fee > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Plataforma (3%)</span>
                  <span className="font-numbers tabular-nums font-semibold text-slate-700">
                    {formatCurrency(fee)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Total
                </span>
                <span className="font-display font-black text-xl sm:text-2xl tabular-nums text-slate-900">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            disabled={soldOut || loading || selected.length === 0}
            onClick={reserveAndPay}
            className={cn(
              "w-full h-11 sm:h-12 text-sm sm:text-base font-bold rounded-xl shadow-cta active:scale-[0.98]",
              soldOut
                ? "!bg-slate-300 !text-slate-500"
                : "!bg-gradient-to-r from-brand-rose to-brand-violet !text-white"
            )}
          >
            {soldOut ? (
              <>Agotada</>
            ) : loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reservando…
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Reservar y pagar
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5">
              🔒 SSL
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 justify-end">
              ⏱ Bloqueo 15 min
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );

  return (
    <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-5 w-full overflow-hidden">
      <div className="lg:col-span-3 min-w-0 w-full">{numberGrid}</div>
      <div className="lg:col-span-2 min-w-0 w-full">{paymentAside}</div>
    </div>
  );
}
