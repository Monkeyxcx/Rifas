export interface ThemeColorTokens {
  brand: {
    rose: string;
    violet: string;
    cyan: string;
    gold: string;
  };
  status: {
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  neutral: {
    bg: string;
    card: string;
    text: string;
    muted: string;
    border: string;
  };
  gradient: {
    primary: string;
    solidarity: string;
    success: string;
    warning: string;
    danger: string;
    cta: string;
  };
}

export const COLORS_HEX: ThemeColorTokens = {
  brand: {
    rose: "#FF1B51",
    violet: "#7C3AED",
    cyan: "#06B6D4",
    gold: "#F59E0B"
  },
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#F43F5E",
    info: "#0EA5E9"
  },
  neutral: {
    bg: "#F8FAFC",
    card: "#FFFFFF",
    text: "#0F172A",
    muted: "#94A3B8",
    border: "#E2E8F0"
  },
  gradient: {
    primary: "from-brand-rose via-pink-500 to-brand-violet",
    solidarity: "from-brand-cyan via-cyan-500 to-brand-rose",
    success: "from-emerald-500 via-emerald-500 to-brand-cyan",
    warning: "from-brand-gold via-amber-500 to-orange-500",
    danger: "from-rose-500 via-rose-600 to-brand-violet",
    cta: "from-brand-rose to-brand-violet"
  }
};

export const GRADIENT_CLASSES = {
  cardPrimary: `bg-gradient-to-br ${COLORS_HEX.gradient.primary}`,
  cardSolidarity: `bg-gradient-to-br ${COLORS_HEX.gradient.solidarity}`,
  cardSuccess: `bg-gradient-to-br ${COLORS_HEX.gradient.success}`,
  cardWarning: `bg-gradient-to-br ${COLORS_HEX.gradient.warning}`,
  cardDanger: `bg-gradient-to-br ${COLORS_HEX.gradient.danger}`,
  ctaButton: `!bg-gradient-to-r ${COLORS_HEX.gradient.cta} !text-white`,
  ctaButtonSolidarity: `!bg-gradient-to-r from-brand-cyan to-brand-rose !text-white`,
  progressFill: `[&>div]:bg-gradient-to-r [&>div]:from-brand-rose [&>div]:to-brand-violet [&>div]:rounded-full`,
  progressSolidarity: `[&>div]:bg-gradient-to-r [&>div]:from-brand-cyan [&>div]:to-brand-rose [&>div]:rounded-full`,
  tabActive: `data-[state=active]:!bg-gradient-to-r data-[state=active]:from-brand-rose data-[state=active]:to-brand-violet data-[state=active]:!text-white data-[state=active]:shadow-cta`,
  numberActive: `bg-gradient-to-br from-brand-rose to-brand-violet text-white border-transparent shadow-cta active:scale-[0.96]`,
  numberPaid: `border-2 border-emerald-400 bg-gradient-to-br from-emerald-500 via-brand-cyan to-brand-rose text-center shadow-md shadow-emerald-500/20`
} as const;

export const BADGE_CLASSES = {
  paid: `!bg-emerald-100 !text-emerald-700 !border !border-emerald-200`,
  reserved: `!bg-brand-gold/15 !text-amber-700 !border !border-brand-gold/30`,
  pending: `!bg-amber-100 !text-amber-700 !border !border-amber-200`,
  successInline: `rounded-lg bg-emerald-100 px-2 py-1 font-semibold text-emerald-700 shrink-0`,
  warningInline: `rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-700 shrink-0`,
  dangerInline: `rounded-lg bg-rose-100 px-2 py-1 font-semibold text-rose-700 shrink-0`,
  secureShield: `!border-emerald-200 !bg-emerald-50 !text-emerald-700 shrink-0`
} as const;

export const CARD_CLASSES = {
  success: `border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 shadow-sm`,
  warning: `border-dashed border-2 border-dashed border-rose-200 bg-rose-50/40 shadow-sm`,
  dashedInfo: `border-dashed border-slate-200 bg-gradient-to-br from-slate-50/60 via-white to-slate-50`,
  gold: `rounded-xl bg-gradient-to-br from-brand-gold/10 via-white to-brand-rose/5 border border-brand-gold/20`,
  solidarityInfo: `rounded-xl bg-gradient-to-br from-brand-cyan/5 via-white to-brand-rose/5 border border-brand-cyan/20`
} as const;

export const SHADOW_CLASSES = {
  cta: `shadow-cta`,
  hero: `shadow-[0_16px_50px_-18px_rgba(15,23,42,0.18)]`,
  ctaCard: `shadow-[0_16px_50px_-24px_rgba(15,23,42,0.15)]`,
  dangerRose: `shadow-[0_8px_24px_-8px_rgba(255,27,81,0.45)]`,
  successEmerald: `shadow-cta shadow-emerald-500/30`,
  warningAmber: `shadow-cta shadow-amber-500/30`,
  dangerCta: `shadow-cta shadow-rose-500/30`
} as const;
