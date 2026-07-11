import type { Metadata } from "next";
import { Install } from "@/docs/DocsContent/Install";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Installation" };

export default function InstallationPage() {
  return (
    <>
      <h1 className={styles.title}>Installation</h1>
      <p className={styles.lede}>
        Peek runs on macOS. Grab the signed app directly, or build it yourself from source.
      </p>
      <Install />
    </>
  );
}
