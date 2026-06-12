import type { Metadata } from "next";
import { MetricsDashboard } from "@/metrics/MetricsDashboard/MetricsDashboard";
import {
  GRANULARITIES,
  fetchBucketCounts,
  fetchEventTotals,
  type Granularity,
} from "@/metrics/queries";

export const metadata: Metadata = {
  title: "Peek — Metrics",
  // public but unlinked; keep it out of search indexes
  robots: { index: false, follow: false },
};

function parseGranularity(value: string | string[] | undefined): Granularity {
  return GRANULARITIES.find(option => option === value) ?? "day";
}

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { g } = await searchParams;
  const granularity = parseGranularity(g);
  const [buckets, totals] = await Promise.all([fetchBucketCounts(granularity), fetchEventTotals()]);

  return <MetricsDashboard granularity={granularity} buckets={buckets} totals={totals} />;
}
