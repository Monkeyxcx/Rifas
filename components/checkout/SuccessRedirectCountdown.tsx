"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuccessRedirectCountdown({
  target = "/mis-rifas/participando",
  seconds = 8
}: {
  target?: string;
  seconds?: number;
}) {
  const router = useRouter();
  const [remaining, setRemaining] = useState<number>(Math.max(2, seconds | 0));
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (dismissed) return;
    const started = Date.now();
    const targetEnd = started + (remaining * 1000);
    const intervalId = setInterval(() => {
      const rest = Math.max(0, Math.round((targetEnd - Date.now()) / 1000));
      setRemaining(rest);
      if (rest <= 0) {
        clearInterval(intervalId);
        router.push(target);
      }
    }, 250);
    return () => clearInterval(intervalId);
  }, [dismissed, target]);

  if (dismissed) return null;

  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-brand-cyan/20 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-brand-cyan text-white shadow">
          <PartyPopper className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-emerald-800 leading-tight">
            ¡Pago confirmado
          </p>
          <p className="text-xs font-semibold text-emerald-700/90 truncate">
            Redirigiendo a tus tickets en <span className="font-black tabular-nums">{remaining}s</span>…
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="!h-8 !rounded-xl !border-emerald-200 !text-emerald-700 !bg-white/70 hover:!bg-white font-bold"
        onClick={() => setDismissed(true)}
        aria-label="Cancelar redirección automática"
      >
        <X className="mr-1 h-3.5 w-3.5" />
        Cancelar
      </Button>
    </div>
  );
}

export default SuccessRedirectCountdown;
