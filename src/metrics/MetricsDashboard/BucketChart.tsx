import type { BucketCount, Granularity } from "../queries";
import styles from "./BucketChart.module.css";

type BucketChartProps = {
  buckets: BucketCount[];
  granularity: Granularity;
};

type Stack = { bucket: string; cta: number; demo: number };

const BUCKETS_SHOWN: Record<Granularity, number> = { day: 30, week: 12, month: 12 };

// Mirrors Postgres date_trunc in UTC so generated keys line up with the
// "YYYY-MM-DD" bucket strings the query returns (date_trunc('week') → Monday).
function bucketStart(now: Date, granularity: Granularity): Date {
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (granularity === "week") {
    utc.setUTCDate(utc.getUTCDate() - ((utc.getUTCDay() + 6) % 7));
  }
  if (granularity === "month") {
    utc.setUTCDate(1);
  }
  return utc;
}

function stepBack(newest: Date, granularity: Granularity, steps: number): Date {
  const utc = new Date(newest);
  if (granularity === "month") {
    utc.setUTCMonth(utc.getUTCMonth() - steps);
    return utc;
  }
  utc.setUTCDate(utc.getUTCDate() - steps * (granularity === "week" ? 7 : 1));
  return utc;
}

// The query only returns buckets that have events; fill the gaps so quiet days
// render as empty slots instead of silently collapsing the timeline.
function stackBuckets(buckets: BucketCount[], granularity: Granularity): Stack[] {
  const newest = bucketStart(new Date(), granularity);
  const keys = Array.from({ length: BUCKETS_SHOWN[granularity] }, (_, index) =>
    stepBack(newest, granularity, index).toISOString().slice(0, 10),
  ).toReversed();

  const byBucket = new Map(keys.map(key => [key, { bucket: key, cta: 0, demo: 0 }]));
  for (const { bucket, event, count } of buckets) {
    const stack = byBucket.get(bucket);
    if (!stack) {
      continue;
    }
    if (event.startsWith("cta.")) {
      stack.cta += count;
    } else {
      stack.demo += count;
    }
  }
  return [...byBucket.values()];
}

function bucketLabel(bucket: string, granularity: Granularity): string {
  return granularity === "month" ? bucket.slice(0, 7) : bucket.slice(5);
}

export function BucketChart({ buckets, granularity }: BucketChartProps) {
  const stacks = stackBuckets(buckets, granularity);
  const max = Math.max(1, ...stacks.map(stack => stack.cta + stack.demo));
  const labelStep = Math.ceil(stacks.length / 6);

  return (
    <figure className={styles.figure}>
      <div className={styles.chart}>
        {stacks.map((stack, index) => (
          <div
            key={stack.bucket}
            className={styles.column}
            title={`${stack.bucket} — ${stack.cta + stack.demo} events (${stack.cta} beta, ${stack.demo} demo)`}
          >
            <div className={styles.bar}>
              <span
                className={styles.ctaSegment}
                style={{ blockSize: `${(stack.cta / max) * 100}%` }}
              />
              <span
                className={styles.demoSegment}
                style={{ blockSize: `${(stack.demo / max) * 100}%` }}
              />
            </div>
            <span className={styles.label}>
              {index % labelStep === 0 ? bucketLabel(stack.bucket, granularity) : ""}
            </span>
          </div>
        ))}
      </div>
      <figcaption className={styles.legend}>
        <span className={styles.ctaKey}>Get the Beta</span>
        <span className={styles.demoKey}>Demo canvas</span>
      </figcaption>
    </figure>
  );
}
