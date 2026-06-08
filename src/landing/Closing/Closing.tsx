import { SectionHeading } from "../SectionHeading/SectionHeading";
import styles from "./Closing.module.css";

export function Closing() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <SectionHeading eyebrow='— ready to peek —' accent='yellow' align='center' size='display'>
          Take a look <em>around.</em>
        </SectionHeading>
      </div>
    </section>
  );
}
