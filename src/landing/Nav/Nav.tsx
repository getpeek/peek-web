"use client";

import Link from "next/link";
import styles from "./Nav.module.css";
import Image from "next/image";
import { TrackedLink } from "@/metrics/TrackedLink";
import { useScrolled } from "./useScrolled";

const githubUrl = "https://github.com/getpeek/peek";

type NavProps = {
  sticky?: boolean;
  currentPage?: "docs" | "changelog" | "features";
  downloadUrl: string;
};

export function Nav({ sticky = false, currentPage, downloadUrl }: NavProps) {
  const scrolled = useScrolled();
  const className = [styles.nav, sticky && styles.sticky, sticky && scrolled && styles.scrolled]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={className}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href='/'>
            <Image width={48} height={48} src='/logo.png' alt='Peek' />
          </Link>
        </div>
        <div className={styles.links}>
          <Link
            href='/features'
            className={currentPage === "features" ? styles.current : undefined}
          >
            Features
          </Link>
          <Link href='/docs' className={currentPage === "docs" ? styles.current : undefined}>
            Docs
          </Link>
          <Link
            href='/changelog'
            className={currentPage === "changelog" ? styles.current : undefined}
          >
            Changelog
          </Link>
          <a href={githubUrl} rel='noreferrer'>
            GitHub
          </a>
        </div>
        <TrackedLink event='cta.nav' className={styles.ctaMini} href={downloadUrl}>
          Get the Beta →
        </TrackedLink>
      </div>
    </nav>
  );
}
