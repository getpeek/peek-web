import type { ReactNode } from "react";

import styles from "./SectionHeading.module.css";

type Accent = "blue" | "yellow" | "mauve" | "olive";

type SectionHeadingProps = {
  eyebrow?: string;
  /** Heading text; may contain an <em> for the italic accent word. */
  children: ReactNode;
  /** Colors any <em> in the heading. Omit to leave the <em> white. */
  accent?: Accent;
  align?: "start" | "center";
  /** "display" is the oversized, tighter closing-CTA scale. */
  size?: "section" | "display";
  as?: "h1" | "h2";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  children,
  accent,
  align = "start",
  size = "section",
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-accent={accent}
      data-align={align}
      data-size={size}
    >
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <Heading className={styles.heading}>{children}</Heading>
    </div>
  );
}
