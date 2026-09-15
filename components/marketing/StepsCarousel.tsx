"use client";

import { ArrowRight, Gift, Sparkles, Ticket, Zap, type LucideIcon } from "lucide-react";
import { AutoCarousel } from "@/components/marketing/AutoCarousel";

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Ticket,
  Zap,
  Gift
};

export type StepCard = {
  n: string;
  title: string;
  desc: string;
  icon: keyof typeof ICONS;
};

type Props = {
  steps: StepCard[];
};

function StepCardView({
  step,
  showArrow
}: {
  step: StepCard;
  showArrow: boolean;
}) {
  const Icon = ICONS[step.icon] ?? Sparkles;
  return (
    <div className="relative card-base p-6 overflow-hidden h-full">
      <div className="absolute -right-4 -top-6 font-display font-extrabold text-[120px] leading-none text-slate-100 dark:text-slate-800 select-none">
        {step.n}
      </div>
      <div className="relative">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-brand-rose mb-4 dark:bg-slate-800">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="!text-lg">{step.title}</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.desc}</p>
        {showArrow && (
          <ArrowRight className="hidden lg:block absolute top-14 -right-10 h-6 w-6 text-slate-300 dark:text-slate-600" />
        )}
      </div>
    </div>
  );
}

export function StepsCarousel({ steps }: Props) {
  return (
    <AutoCarousel
      itemCount={steps.length}
      labels={steps.map((s) => s.title)}
      desktopClassName="md:grid-cols-2 lg:grid-cols-4"
      renderItem={(i, mode) => (
        <StepCardView
          step={steps[i]!}
          showArrow={mode === "desktop" && i < steps.length - 1}
        />
      )}
    />
  );
}

export default StepsCarousel;
