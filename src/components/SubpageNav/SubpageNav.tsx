"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollSpy } from "./useScrollSpy";
import styles from "./SubpageNav.module.css";

export type SubpageNavItem = {
  label: string;
  slug: string;
  children?: SubpageNavItem[];
};

type SubpageNavProps = {
  tree: SubpageNavItem[];
  root: string;
  ariaLabel: string;
};

// Items nested under a top-level entry are in-page sections (anchors) on their
// parent's route - the only slugs scrollspy can track, and only while that
// parent page is open.
const collectSlugs = (items: SubpageNavItem[]): string[] =>
  items.flatMap(item => [item.slug, ...collectSlugs(item.children ?? [])]);

const noSlugs: string[] = [];

export function SubpageNav({ tree, root, ariaLabel }: SubpageNavProps) {
  const pathname = usePathname();
  const sectionSlugs = tree.flatMap(item => collectSlugs(item.children ?? []));
  const onSectionedPage = tree.some(item => item.children && pathname === `${root}/${item.slug}`);
  const activeSection = useScrollSpy(onSectionedPage ? sectionSlugs : noSlugs);

  return (
    <nav aria-label={ariaLabel} className={styles.nav}>
      <NavList
        items={tree}
        depth={0}
        topSlug=''
        root={root}
        pathname={pathname}
        activeSection={activeSection}
      />
    </nav>
  );
}

type NavListProps = {
  items: SubpageNavItem[];
  depth: number;
  topSlug: string;
  root: string;
  pathname: string;
  activeSection: string | null;
};

function NavList({ items, depth, topSlug, root, pathname, activeSection }: NavListProps) {
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
              root={root}
              pathname={pathname}
              activeSection={activeSection}
            />
            <NavList
              items={item.children}
              depth={depth + 1}
              topSlug={itemTopSlug}
              root={root}
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
            root={root}
            pathname={pathname}
            activeSection={activeSection}
          />
        );
      })}
    </div>
  );
}

type NavLinkProps = {
  item: SubpageNavItem;
  depth: number;
  topSlug: string;
  root: string;
  pathname: string;
  activeSection: string | null;
};

function NavLink({ item, depth, topSlug, root, pathname, activeSection }: NavLinkProps) {
  const isTop = depth === 0;
  const route = `${root}/${isTop ? item.slug : topSlug}`;
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
