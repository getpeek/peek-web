import Link from "next/link";
import styles from "@/docs/DocsContent/DocsContent.module.css";

export default function DocsHome() {
  return (
    <>
      <h1 className={styles.title}>Peek documentation</h1>
      <p className={styles.lede}>
        Everything you need to install Peek, connect your first database, and tune workspaces,
        themes, AI, and multiplayer to your team.
      </p>
      <p className={styles.lede}>
        New here? Start with <Link href='/docs/installation'>Installation</Link>, then walk through{" "}
        <Link href='/docs/getting-started'>Getting started</Link>.
      </p>
    </>
  );
}
