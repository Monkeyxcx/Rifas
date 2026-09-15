"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const AUTO_MS = 4000;

type Props = {
  itemCount: number;
  labels: string[];
  desktopClassName: string;
  renderItem: (index: number, mode: "mobile" | "desktop") => ReactNode;
};

export function AutoCarousel({
  itemCount,
  labels,
  desktopClassName,
  renderItem
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
    activeRef.current = index;
    setActive(index);
  }, []);

  const pauseTemporarily = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, AUTO_MS * 2);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      if (!cards.length) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((card, i) => {
        const center = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
      activeRef.current = best;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (itemCount < 2) return;

    const id = setInterval(() => {
      if (pausedRef.current) return;
      if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
        return;
      }
      goTo((activeRef.current + 1) % itemCount);
    }, AUTO_MS);

    return () => {
      clearInterval(id);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [itemCount, goTo]);

  return (
    <div className="w-full">
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 -mx-4 px-4 md:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
        onPointerDown={pauseTemporarily}
        onTouchStart={pauseTemporarily}
      >
        {Array.from({ length: itemCount }, (_, i) => (
          <div key={labels[i] ?? i} className="snap-center shrink-0 w-[85%] max-w-sm">
            {renderItem(i, "mobile")}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 md:hidden">
        {Array.from({ length: itemCount }, (_, i) => (
          <button
            key={labels[i] ?? i}
            type="button"
            aria-label={`Ir a ${labels[i] ?? i + 1}`}
            aria-current={active === i}
            onClick={() => {
              pauseTemporarily();
              goTo(i);
            }}
            className={cn(
              "h-2 rounded-full transition-all",
              active === i ? "w-6 bg-brand-rose" : "w-2 bg-slate-300 hover:bg-slate-400"
            )}
          />
        ))}
      </div>

      <div className={cn("hidden md:grid gap-6", desktopClassName)}>
        {Array.from({ length: itemCount }, (_, i) => (
          <div key={labels[i] ?? i}>{renderItem(i, "desktop")}</div>
        ))}
      </div>
    </div>
  );
}
