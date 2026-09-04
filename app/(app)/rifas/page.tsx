import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import RifaListFiltersClient from "@/components/rifas/RifaListFiltersClient";
import { createClient } from "@/lib/supabase/server";
import type { Rifa, RifaStats } from "@/lib/types";

export const revalidate = 30;

async function getActiveRifas(): Promise<Array<{ rifa: Rifa; stats: RifaStats }>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("rifas")
      .select(
        `id,creator_id,title,slug,description,prize_name,prize_image_url,prize_value,
         is_solidarity,cause_name,cause_description,cause_target,
         number_price,total_numbers,available_numbers,status,ends_at,draw_date,
         draw_instructions,created_at,updated_at,
         creator:profiles!rifas_creator_id_fkey(id,full_name,avatar_url,country)`
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) return [];
    return (data as Rifa[]).map((row) => {
      const total = Number(row.total_numbers) || 0;
      const avail = Number(row.available_numbers) ?? total;
      const sold = Math.max(0, total - avail);
      const soldPct =
        total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
      return {
        rifa: row as Rifa,
        stats: {
          rifa_id: row.id,
          total_numbers: total,
          sold_numbers: sold,
          available_numbers: avail,
          sold_percentage: soldPct,
          number_price: Number(row.number_price) || 0,
          status: row.status as RifaStats["status"],
          created_at: row.created_at as string,
          ends_at: (row.ends_at as string | null) ?? null,
          draw_date: (row.draw_date as string | null) ?? null
        } as RifaStats
      };
    });
  } catch (e) {
    console.error("[rifas] fetch real failed", e);
    return [];
  }
}

function RifasListFallback() {
  return (
    <div className="container max-w-content py-10 md:py-14 space-y-8">
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-12 w-full max-w-3xl rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 pt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-[4/5] rounded-3xl bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}

async function RifasListInner({
  searchParamsPromise
}: {
  searchParamsPromise: Promise<{
    q?: string;
    tab?: string;
    sort?: string;
    max?: string;
  }>;
}) {
  const raw = await searchParamsPromise;
  const initialQuery = raw.q ?? "";
  const initialTab: string = raw.tab ?? "all";
  type SortKey = "trending" | "ending" | "newest" | "cheapest";
  const initialSort: SortKey = (raw.sort as SortKey) ?? "trending";
  const initialMaxPrice = Number(raw.max ?? 0) || 0;

  const allRifas = await getActiveRifas();

  const totalRifas = allRifas.length;
  const totalSolidarity = allRifas.filter((x) => x.rifa.is_solidarity).length;
  const totalRaised = allRifas.reduce(
    (acc, { rifa, stats }) =>
      acc + stats.sold_numbers * Number(rifa.number_price || 0),
    0
  );
  const totalNumbersSold = allRifas.reduce(
    (acc, { stats }) => acc + stats.sold_numbers,
    0
  );
  const maxPriceAvailable =
    allRifas.length > 0
      ? Math.max(...allRifas.map((x) => Number(x.rifa.number_price) || 0))
      : 100_000;

  return (
    <RifaListFiltersClient
      allRifas={allRifas}
      initialQuery={initialQuery}
      initialTab={initialTab}
      initialSort={initialSort}
      initialMaxPrice={initialMaxPrice}
      maxPriceAvailable={maxPriceAvailable}
      totalRifas={totalRifas}
      totalSolidarity={totalSolidarity}
      totalRaised={totalRaised}
      totalNumbersSold={totalNumbersSold}
    />
  );
}

export default async function RifasListPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; tab?: string; sort?: string; max?: string }>;
}) {
  return (
    <Suspense fallback={<RifasListFallback />}>
      <RifasListInner searchParamsPromise={searchParams} />
    </Suspense>
  );
}
