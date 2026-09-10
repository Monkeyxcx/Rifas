"use client";

import React, { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, generateRaffleNumbers, padRaffleNumber } from "@/lib/utils";

export type NumberState = "available" | "selected" | "sold" | "mine";

interface NumberGridProps {
  totalNumbers: number;
  numberPrice: number;
  soldNumbers?: Set<string>;
  mineNumbers?: Set<string>;
  soldPercentage?: number;
  onChange?: (selected: string[]) => void;
  maxSelections?: number;
}

function makeSoldSet(total: number, percentage: number): Set<string> {
  const count = Math.max(0, Math.min(total, Math.round((total * percentage) / 100)));
  const s = new Set<string>();
  let seed = 42;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  }
  while (s.size < count) {
    const n = Math.floor(rand() * total);
    s.add(padRaffleNumber(n));
  }
  return s;
}

export default function NumberGrid({
  totalNumbers,
  numberPrice,
  soldNumbers,
  mineNumbers,
  soldPercentage = 0,
  onChange,
  maxSelections = 20
}: NumberGridProps) {
  const allNumbers = useMemo(() => generateRaffleNumbers(totalNumbers), [totalNumbers]);
  const computedSold = useMemo(
    () => soldNumbers ?? makeSoldSet(totalNumbers, soldPercentage),
    [soldNumbers, totalNumbers, soldPercentage]
  );
  const mine = mineNumbers ?? new Set<string>();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(num: string) {
    if (computedSold.has(num)) return;
    if (mine.has(num)) return;
    const next = new Set(selected);
    if (next.has(num)) {
      next.delete(num);
    } else {
      if (next.size >= maxSelections) return;
      next.add(num);
    }
    setSelected(next);
    onChange?.(Array.from(next).sort());
  }

  function pickRandom(count: number) {
    const avail = allNumbers.filter((n) => !computedSold.has(n) && !selected.has(n));
    const picks: string[] = [];
    let i = 0;
    const safe = Math.max(0, Math.min(count, avail.length, maxSelections - selected.size));
    while (picks.length < safe) {
      const randIdx = Math.floor(Math.random() * avail.length);
      const pick = avail.splice(randIdx, 1)[0];
      if (pick) picks.push(pick);
      i++;
      if (i > 1000) break;
    }
    const next = new Set(selected);
    picks.forEach((p) => next.add(p));
    setSelected(next);
    onChange?.(Array.from(next).sort());
  }

  function clear() {
    setSelected(new Set());
    onChange?.([]);
  }

  function stateOf(n: string): NumberState {
    if (mine.has(n)) return "mine";
    if (computedSold.has(n)) return "sold";
    if (selected.has(n)) return "selected";
    return "available";
  }

  const selectedList = useMemo(() => Array.from(selected).sort(), [selected]);
  const total = selectedList.length * numberPrice;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
            Elige tus números
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Máx. {maxSelections} · Clic para seleccionar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            Aleatorio:
          </span>
          {[5, 10, 15].map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => pickRandom(c)}
              className="h-7 sm:h-8 rounded-full text-[11px] sm:text-xs px-2 sm:px-2.5"
            >
              +{c}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clear}
            disabled={selected.size === 0}
            className="h-7 sm:h-8 rounded-full text-[11px] sm:text-xs px-2 sm:px-2.5"
          >
            Limpiar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-4 sm:h-4 sm:w-5 rounded bg-white border border-slate-200" />
          <span className="text-slate-500">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-4 sm:h-4 sm:w-5 rounded bg-gradient-to-r from-brand-rose to-brand-violet shadow-cta" />
          <span className="text-slate-500">Seleccionado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-4 sm:h-4 sm:w-5 rounded bg-slate-100 border border-slate-200 text-slate-300 line-through text-[8px] sm:text-[9px] grid place-items-center">
            88
          </div>
          <span className="text-slate-500">Vendido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-4 sm:h-4 sm:w-5 rounded bg-brand-cyan/10 border-2 border-brand-cyan" />
          <span className="text-slate-500">Tuyos</span>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1 sm:gap-1.5 md:gap-2 text-center font-numbers tabular-nums">
        {allNumbers.map((n) => {
          const st = stateOf(n);
          const disabled = st === "sold" || st === "mine";
          return (
            <button
              key={n}
              type="button"
              onClick={() => toggle(n)}
              disabled={disabled}
              aria-label={
                st === "sold"
                  ? `Número ${n} vendido`
                  : st === "mine"
                    ? `Número ${n} ya reservado por ti`
                    : st === "selected"
                      ? `Número ${n} seleccionado`
                      : `Seleccionar número ${n}`
              }
              className={cn(
                "relative aspect-square w-full rounded-md sm:rounded-lg text-[13px] sm:text-sm font-semibold transition-all duration-150 select-none",
                st === "available" &&
                  "bg-white border border-slate-200 text-slate-700 hover:-translate-y-[1px] hover:border-brand-rose hover:text-brand-rose hover:shadow-[0_6px_18px_-10px_rgba(255,27,81,0.35)] active:scale-[0.96]",
                st === "selected" &&
                  "bg-gradient-to-br from-brand-rose to-brand-violet text-white border-transparent shadow-cta active:scale-[0.96]",
                st === "sold" &&
                  "bg-slate-100 border border-slate-200 text-slate-300 line-through cursor-not-allowed opacity-70",
                st === "mine" &&
                  "bg-brand-cyan/10 border-2 border-brand-cyan text-brand-cyan-700 font-bold cursor-default"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
