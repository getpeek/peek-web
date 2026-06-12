import type { Metadata } from "next";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Getting started" };

export default function GettingStartedPage() {
  return (
    <>
      <h1 className={styles.title}>Getting started</h1>
      <p className={styles.lede}>
        Open your first connection, run a query, and read results on the canvas.
      </p>
      <div className={styles.placeholder}>Design this section next - first-run walkthrough</div>
    </>
  );
}
