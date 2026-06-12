import type { Metadata } from "next";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Themes" };

export default function ThemesPage() {
  return (
    <>
      <h1 className={styles.title}>Themes</h1>
      <p className={styles.lede}>
        Make Peek yours — built-in dark and light themes, custom palettes, and per-workspace looks.
      </p>
      <div className={styles.placeholder}>Design this section next — themes demo</div>
    </>
  );
}
