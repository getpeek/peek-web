import type { Metadata } from "next";
import { Keybindings } from "@/docs/DocsContent/Keybindings";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Keybindings" };

export default function KeybindingsPage() {
  return (
    <>
      <h1 className={styles.title}>Keybindings</h1>
      <p className={styles.lede}>
        Drive Peek from the keyboard. Defaults are listed below — every binding can be remapped from{" "}
        <strong>Settings → Keybindings</strong>.
      </p>
      <Keybindings />
    </>
  );
}
