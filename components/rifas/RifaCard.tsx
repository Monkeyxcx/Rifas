"use client";

import Link from "next/link";
import {
  Ticket,
  Heart,
  Users,
  Clock,
  Trophy,
  Calendar,
  MapPin,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrency, formatRelativeTime, padRaffleNumber } from "@/lib/utils";
import type { Rifa, RifaStats } from "@/lib/types";

type RifaCardProps = {
  rifa: Rifa;
  stats?: RifaStats;
  className?: string;
};

export function RifaCard({ rifa, stats, className }: RifaCardProps) {
  const {
    id,
    title,
    prize_name,
    prize_image_url,
    prize_value,
    is_solidarity,
    cause_name,
    number_price,
    total_numbers,
    available_numbers,
    ends_at,
    draw_date,
    creator
  } = rifa;

  const sold = total_numbers - available_numbers;
  const pct = Math.min(
    100,
    Math.round((sold / Math.max(1, total_numbers)) * 100)
  );
  const sampleWinningNumber = padRaffleNumber(
    Math.floor(Math.random() * Math.max(10, total_numbers))
  );

  const endsAtDisplay = ends_at ? formatRelativeTime(ends_at) : null;
  const drawAtDisplay = draw_date ? formatRelativeTime(draw_date) : null;

  return (
    <Link
      href={`/rifas/${id}`}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_14px_40px_-12px_rgba(255,27,81,0.18)] hover:border-brand-rose/30",
        className
      )}
    >
      {/* ======= Imagen premio ======= */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
        {prize_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prize_image_url}
            alt={prize_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-6 text-center",
              is_solidarity
                ? "bg-gradient-solidario"
                : "bg-gradient-premio"
            )}
          >
            <span
              aria-hidden
              className="absolute inset-0 opacity-10 mix-blend-overlay"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 20%, black 1.2px, transparent 1.2px), radial-gradient(circle at 80% 70%, white 1.2px, transparent 1.2px)",
                backgroundSize: "18px 18px, 22px 22px"
              }}
            />
            <div className="relative grid h-20 w-20 place-items-center rounded-2xl bg-white/90 shadow-lg backdrop-blur">
              {is_solidarity ? (
                <Heart className="h-10 w-10 text-brand-rose" fill="currentColor" />
              ) : (
                <Trophy className="h-10 w-10 text-brand-gold" />
              )}
            </div>
            <p className="relative mt-4 font-display font-extrabold text-2xl text-white drop-shadow-md px-4 leading-tight">
              {prize_name}
            </p>
          </div>
        )}

        {/* Badges top stack */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex flex-col items-start gap-2">
            {is_solidarity ? (
              <Badge variant="solidarity" className="gap-1">
                <Heart className="h-3 w-3" fill="currentColor" />
                Solidaria
              </Badge>
            ) : (
              <Badge variant="prize" className="gap-1">
                <Trophy className="h-3 w-3" />
                Premio
              </Badge>
            )}
            {stats?.sold_percentage === 100 ? (
              <Badge variant="closed">Sorteo cerrado</Badge>
            ) : pct >= 75 ? (
              <Badge variant="new" className="gap-1">
                <Sparkles className="h-3 w-3" />
                ¡Se agota!
              </Badge>
            ) : null}
          </div>

          <div className="rounded-xl bg-white/95 backdrop-blur px-3 py-1.5 shadow-md border border-slate-200/80">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Valor
            </div>
            <div className="font-display font-extrabold text-slate-900 text-sm leading-tight">
              {formatCurrency(prize_value)}
            </div>
          </div>
        </div>
      </div>

      {/* ======= Body ======= */}
      <div className="flex flex-1 flex-col p-5 gap-4">
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 line-clamp-2 leading-snug">
            {title}
          </h3>
          {is_solidarity && cause_name ? (
            <p className="mt-1.5 text-xs text-brand-violet font-semibold flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              Causa: <span className="underline decoration-brand-violet/40 underline-offset-2">{cause_name}</span>
            </p>
          ) : null}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {sold}/{total_numbers} números vendidos
            </span>
            <span className="font-display font-extrabold text-brand-rose">
              {pct}%
            </span>
          </div>
          <Progress
            value={pct}
            className={cn(
              "h-2.5 rounded-full bg-slate-100",
              "[&>div]:bg-gradient-to-r [&>div]:from-brand-rose [&>div]:via-fuchsia-500 [&>div]:to-brand-violet [&>div]:rounded-full"
            )}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Ticket className="h-3.5 w-3.5 text-brand-cyan" />
              <span>Desde </span>
              <span className="font-bold text-slate-900">
                {formatCurrency(number_price)}
              </span>
            </span>
            {endsAtDisplay && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Cierra {endsAtDisplay}
              </span>
            )}
            {drawAtDisplay && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-brand-gold" />
                Sorteo {drawAtDisplay}
              </span>
            )}
          </div>
        </div>

        {/* Posible ganador de ejemplo (placeholder UI) */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
          <div className="grid h-9 w-12 place-items-center rounded-lg bg-white shadow-sm font-numbers font-black text-lg tracking-wider text-slate-900 ring-1 ring-slate-200">
            {sampleWinningNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              Números disponibles
            </div>
            <div className="text-xs text-slate-700 truncate">
              Elige los tuyos: <span className="font-semibold text-slate-900">{available_numbers}</span> restantes
            </div>
          </div>
          <Users className="h-4 w-4 text-slate-400 shrink-0" />
        </div>

        {/* Creador / CTA */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              aria-hidden
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white bg-gradient-to-br from-brand-rose via-fuchsia-500 to-brand-violet shadow-sm"
            >
              {creator?.full_name
                ?.split(" ")
                .map((x) => x[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() ??
                creator?.id?.slice(0, 2).toUpperCase() ??
                "RC"}
            </span>
            <div className="min-w-0 text-xs">
              <div className="font-semibold text-slate-800 truncate">
                {creator?.full_name ?? "Rifas Center"}
              </div>
              <div className="text-slate-500 inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {creator?.country ?? "LATAM"}
              </div>
            </div>
          </div>

          <Button
            asChild
            size="sm"
            variant="gradient"
            className="shrink-0 gap-1.5"
          >
            <span>
              Ver números
              <Ticket className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
