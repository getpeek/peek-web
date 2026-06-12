import { getSql } from "./db";

export const GRANULARITIES = ["day", "week", "month"] as const;

export type Granularity = (typeof GRANULARITIES)[number];

export type BucketCount = {
  bucket: string;
  event: string;
  count: number;
};

export type EventTotal = {
  event: string;
  count: number;
};

// how far back each granularity looks
const WINDOWS: Record<Granularity, string> = {
  day: "30 days",
  week: "12 weeks",
  month: "12 months",
};

export async function fetchBucketCounts(granularity: Granularity): Promise<BucketCount[] | null> {
  const sql = getSql();
  if (!sql) {
    return null;
  }
  // ::date::text so buckets arrive as plain "YYYY-MM-DD" strings
  const rows = await sql`
    SELECT date_trunc(${granularity}, occurred_at)::date::text AS bucket,
           event,
           count(*)::int AS count
    FROM events
    WHERE occurred_at >= now() - ${WINDOWS[granularity]}::interval
    GROUP BY bucket, event
    ORDER BY bucket ASC, event ASC
  `;
  return rows as BucketCount[];
}

export async function fetchEventTotals(): Promise<EventTotal[] | null> {
  const sql = getSql();
  if (!sql) {
    return null;
  }
  const rows = await sql`
    SELECT event, count(*)::int AS count
    FROM events
    GROUP BY event
    ORDER BY count DESC
  `;
  return rows as EventTotal[];
}
