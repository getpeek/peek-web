import type { ReactNode } from "react";
import styles from "./DocsContent.module.css";

type DocsSectionProps = {
  slug: string;
  title: string;
  level: 2 | 3 | 4;
  children: ReactNode;
};

export function DocsSection({ slug, title, level, children }: DocsSectionProps) {
  const Heading = level === 2 ? "h2" : level === 3 ? "h3" : "h4";
  const className = level === 2 ? styles.section : `${styles.section} ${styles.sub}`;

  return (
    <section id={slug} className={className}>
      <Heading>{title}</Heading>
      {children}
    </section>
  );
}
