"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocsNavItem } from "../navTree";
import { navTree } from "../navTree";
import { useScrollSpy } from "./useScrollSpy";
import styles from "./DocsNav.module.css";

const DOCS_ROOT = "/docs";

// Items nested under a top-level entry are in-page sections (anchors) on their
// parent's route — the only slugs scrollspy can track, and only while that
// parent page is open.
const collectSlugs = (items: DocsNavItem[]): string[] =>
  items.flatMap(item => [item.slug, ...collectSlugs(item.children ?? [])]);
const sectionSlugs = navTree.flatMap(item => collectSlugs(item.children ?? []));
const noSlugs: string[] = [];

export function DocsNav() {
  const pathname = usePathname();
  const onSectionedPage = navTree.some(
    item => item.children && pathname === `${DOCS_ROOT}/${item.slug}`,
  );
  const activeSection = useScrollSpy(onSectionedPage ? sectionSlugs : noSlugs);

  return (
    <nav aria-label='Documentation' className={styles.nav}>
      <NavList
        items={navTree}
        depth={0}
        topSlug=''
        pathname={pathname}
        activeSection={activeSection}
      />
    </nav>
  );
}

type NavListProps = {
  items: DocsNavItem[];
  depth: number;
  topSlug: string;
  pathname: string;
  activeSection: string | null;
};

function NavList({ items, depth, topSlug, pathname, activeSection }: NavListProps) {
  return (
    <div className={depth === 0 ? styles.list : styles.children}>
      {items.map(item => {
        const itemTopSlug = depth === 0 ? item.slug : topSlug;
        return item.children ? (
          <div key={item.slug} className={styles.group}>
            <NavLink
              item={item}
              depth={depth}
              topSlug={itemTopSlug}
              pathname={pathname}
              activeSection={activeSection}
            />
            <NavList
              items={item.children}
              depth={depth + 1}
              topSlug={itemTopSlug}
              pathname={pathname}
              activeSection={activeSection}
            />
          </div>
        ) : (
          <NavLink
            key={item.slug}
            item={item}
            depth={depth}
            topSlug={itemTopSlug}
            pathname={pathname}
            activeSection={activeSection}
          />
        );
      })}
    </div>
  );
}

type NavLinkProps = {
  item: DocsNavItem;
  depth: number;
  topSlug: string;
  pathname: string;
  activeSection: string | null;
};

function NavLink({ item, depth, topSlug, pathname, activeSection }: NavLinkProps) {
  const isTop = depth === 0;
  const route = `${DOCS_ROOT}/${isTop ? item.slug : topSlug}`;
  const href = isTop ? route : `${route}#${item.slug}`;
  // sub-items light up from scrollspy, but only while their parent page is open
  const active = isTop ? pathname === route : pathname === route && activeSection === item.slug;

  const depthClass = depth === 0 ? styles.level0 : depth === 1 ? styles.level1 : styles.level2;
  const className = [styles.link, depthClass, active && styles.active].filter(Boolean).join(" ");

  return (
    <Link className={className} href={href}>
      {item.label}
    </Link>
  );
}
