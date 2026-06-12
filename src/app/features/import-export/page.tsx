import type { Metadata } from "next";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Import / Export" };

export default function ImportExportPage() {
  return (
    <>
      <h1 className={styles.title}>Import / Export</h1>
      <p className={styles.lede}>
        Bring data in from CSV and JSON, send results out to anywhere — without leaving the canvas.
      </p>
      <div className={styles.placeholder}>Design this section next — import/export demo</div>
    </>
  );
}
