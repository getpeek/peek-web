import type { Metadata } from "next";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Editing Data" };

export default function EditingDataPage() {
  return (
    <>
      <h1 className={styles.title}>Editing Data</h1>
      <p className={styles.lede}>
        Edit rows inline, right in the result node — with full awareness of constraints and types,
        and a review step before anything is written back.
      </p>
      <div className={styles.placeholder}>Design this section next — editing demo</div>
    </>
  );
}
