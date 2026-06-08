import { SectionHeading } from "../SectionHeading/SectionHeading";
import styles from "./Stats.module.css";

export function Stats() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <SectionHeading eyebrow='Telemetry · the numbers'>
          Built for the way data <em>actually</em> flows.
        </SectionHeading>
      </div>
    </section>
  );
}
