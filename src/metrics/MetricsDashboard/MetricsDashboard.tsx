import Link from "next/link";
import { GRANULARITIES, type BucketCount, type EventTotal, type Granularity } from "../queries";
import { BucketChart } from "./BucketChart";
import { DemoBarChart } from "./DemoBarChart";
import styles from "./MetricsDashboard.module.css";

type MetricsDashboardProps = {
  granularity: Granularity;
  buckets: BucketCount[] | null;
  totals: EventTotal[] | null;
};

function sumWhere(totals: EventTotal[], prefix: string): number {
  return totals
    .filter(total => total.event.startsWith(prefix))
    .reduce((sum, total) => sum + total.count, 0);
}

export function MetricsDashboard({ granularity, buckets, totals }: MetricsDashboardProps) {
  if (!buckets || !totals) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Metrics</h1>
        <p className={styles.notice}>
          No database configured — set <code>DATABASE_URL</code> and run the one-time setup in{" "}
          <code>src/metrics/schema.sql</code>.
        </p>
      </main>
    );
  }

  const betaClicks = sumWhere(totals, "cta.");
  const demoInteractions = sumWhere(totals, "demo.");

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Metrics</h1>
        <p className={styles.sub}>
          Anonymous interaction counts — an event name and a timestamp, nothing else.
        </p>
      </header>

      <section className={styles.summary}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{betaClicks + demoInteractions}</span>
          <span className={styles.statLabel}>events all time</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{betaClicks}</span>
          <span className={styles.statLabel}>beta clicks</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{demoInteractions}</span>
          <span className={styles.statLabel}>demo interactions</span>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Per {granularity}</h2>
          <nav className={styles.tabs}>
            {GRANULARITIES.map(option => (
              <Link
                key={option}
                href={option === "day" ? "/metrics" : `/metrics?g=${option}`}
                className={option === granularity ? styles.active : undefined}
              >
                {option}
              </Link>
            ))}
          </nav>
        </div>
        <BucketChart buckets={buckets} granularity={granularity} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Demo canvas interactions</h2>
        <DemoBarChart totals={totals} />
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>All time by event</h2>
        {totals.length === 0 ? (
          <p className={styles.notice}>No events recorded yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Event</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {totals.map(({ event, count }) => (
                <tr key={event}>
                  <td>{event}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
