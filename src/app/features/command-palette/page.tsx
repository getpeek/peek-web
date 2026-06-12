import type { Metadata } from "next";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Command Palette" };

export default function CommandPalettePage() {
  return (
    <>
      <h1 className={styles.title}>Command Palette</h1>
      <p className={styles.lede}>
        Every action in Peek — one keystroke away. Summon nodes, run queries, and jump anywhere on
        the canvas without leaving the keyboard.
      </p>
      <div className={styles.placeholder}>Design this section next — command palette demo</div>
    </>
  );
}
