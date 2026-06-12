"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./FeaturesNav.module.css";

const FEATURES_ROOT = "/features";

const navItems = [
  { label: "Command Palette", slug: "command-palette" },
  { label: "Multiplayer", slug: "multiplayer" },
  { label: "AI Agents", slug: "ai-agents" },
  { label: "Editing Data", slug: "editing-data" },
  { label: "Import / Export", slug: "import-export" },
  { label: "Variables", slug: "variables" },
  { label: "Themes", slug: "themes" },
];

export function FeaturesNav() {
  const pathname = usePathname();

  return (
    <nav aria-label='Features' className={styles.nav}>
      {navItems.map(item => {
        const href = `${FEATURES_ROOT}/${item.slug}`;
        const className = [styles.link, pathname === href && styles.active]
          .filter(Boolean)
          .join(" ");
        return (
          <Link key={item.slug} className={className} href={href}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
