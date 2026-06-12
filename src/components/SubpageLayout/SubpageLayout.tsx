import type { ReactNode } from "react";
import { getLatestRelease } from "@/release/latestRelease";
import styles from "./SubpageLayout.module.css";

type SubpageLayoutProps = {
  eyebrow: string;
  nav: ReactNode;
  children: ReactNode;
};

export async function SubpageLayout({ eyebrow, nav, children }: SubpageLayoutProps) {
  const release = await getLatestRelease();
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        {nav}
      </aside>
      <article className={styles.content}>
        <div className={styles.inner}>
          {children}
          <footer className={styles.foot}>
            <span>v{release.version} · public beta</span>
          </footer>
        </div>
      </article>
    </div>
  );
}
