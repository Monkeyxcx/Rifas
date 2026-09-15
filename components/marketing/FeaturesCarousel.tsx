"use client";

import { Gift, Heart, ShieldCheck, type LucideIcon } from "lucide-react";
import { AutoCarousel } from "@/components/marketing/AutoCarousel";

const ICONS: Record<string, LucideIcon> = {
  Gift,
  Heart,
  ShieldCheck
};

export type FeatureCard = {
  icon: keyof typeof ICONS;
  title: string;
  description: string;
  bg: string;
};

type Props = {
  features: FeatureCard[];
};

function FeatureCardView({ feature }: { feature: FeatureCard }) {
  const Icon = ICONS[feature.icon] ?? Gift;
  return (
    <div className="card-base p-6 group h-full">
      <div
        className={`grid h-14 w-14 place-items-center rounded-xl ${feature.bg} shadow-md mb-5`}
      >
        <Icon className="h-7 w-7 text-white" strokeWidth={2.3} />
      </div>
      <h3>{feature.title}</h3>
      <p className="mt-3 text-slate-600 text-sm leading-relaxed">{feature.description}</p>
    </div>
  );
}

export function FeaturesCarousel({ features }: Props) {
  return (
    <AutoCarousel
      itemCount={features.length}
      labels={features.map((f) => f.title)}
      desktopClassName="md:grid-cols-3"
      renderItem={(i) => <FeatureCardView feature={features[i]!} />}
    />
  );
}

export default FeaturesCarousel;
