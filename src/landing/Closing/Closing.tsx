import { SectionHeading } from "../SectionHeading/SectionHeading";
import styles from "./Closing.module.css";

export function Closing() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <SectionHeading
          eyebrow="Please i've spent so much time on this "
          accent='yellow'
          align='center'
          size='display'
        >
          Have a <em>Peek </em> around.
        </SectionHeading>
      </div>
    </section>
  );
}
