import type { Metadata } from "next";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Variables" };

export default function VariablesPage() {
  return (
    <>
      <h1 className={styles.title}>Variables</h1>
      <p className={styles.lede}>
        Define a value once, reference it across every query on the canvas, and re-run the whole
        flow with a single change.
      </p>
      <div className={styles.placeholder}>Design this section next — variables demo</div>
    </>
  );
}
