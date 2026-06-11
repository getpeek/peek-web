import type { ReactNode } from "react";
import { getLatestRelease } from "@/release/latestRelease";
import { DocsNav } from "../DocsNav/DocsNav";
import styles from "./DocsLayout.module.css";

export async function DocsLayout({ children }: { children: ReactNode }) {
  const release = await getLatestRelease();
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <p className={styles.eyebrow}>Documentation</p>
        <DocsNav />
      </aside>
      <article className={styles.doc}>
        <div className={styles.inner}>
          {children}
          <footer className={styles.foot}>
            <span>Peek Labs · getpeek.dev</span>
            <span>v{release.version} · public beta</span>
          </footer>
        </div>
      </article>
    </div>
  );
}
