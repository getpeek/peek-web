import { EVENT_NAMES } from "../events";
import type { EventTotal } from "../queries";
import styles from "./DemoBarChart.module.css";

type DemoBarChartProps = {
  totals: EventTotal[];
};

const DEMO_EVENTS = EVENT_NAMES.filter(event => event.startsWith("demo."));

// One bar per canvas interaction. Built from the allowlist rather than the
// query result so interactions nobody has clicked yet still show as zero
// instead of silently disappearing.
export function DemoBarChart({ totals }: DemoBarChartProps) {
  const countByEvent = new Map(totals.map(total => [total.event, total.count]));
  const rows = DEMO_EVENTS.map(event => ({
    event,
    label: event.slice("demo.".length),
    count: countByEvent.get(event) ?? 0,
  })).toSorted((a, b) => b.count - a.count);
  const max = Math.max(1, ...rows.map(row => row.count));

  return (
    <div className={styles.rows}>
      {rows.map(({ event, label, count }) => (
        <div key={event} className={styles.row}>
          <span className={styles.label}>{label}</span>
          <span className={styles.track}>
            <span className={styles.bar} style={{ inlineSize: `${(count / max) * 100}%` }} />
          </span>
          <span className={styles.count}>{count}</span>
        </div>
      ))}
    </div>
  );
}
