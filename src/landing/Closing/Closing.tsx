import { SectionHeading } from "../SectionHeading/SectionHeading";
import styles from "./Closing.module.css";

export function Closing() {
  return (
    <>
      <section className={styles.section}>
        <div className={styles.container}>
          <SectionHeading eyebrow='So many more features' align='start'>
            <span className={styles.featureList}>
              <em>Keyboard first.</em> <em>LSP.</em> <em>Command Palette.</em>{" "}
              <em>Schema visualization.</em> <em>Themes.</em>
            </span>
          </SectionHeading>
        </div>
      </section>
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
    </>
  );
}
