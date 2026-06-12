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
          <Link href='/'>Peek</Link>
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
        </div>
        <div className={styles.right}>
          <a href={githubUrl} rel='noreferrer' aria-label='GitHub' className={styles.github}>
            <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
              <path d='M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z' />
            </svg>
          </a>
          <TrackedLink event='cta.nav' className={styles.ctaMini} href={downloadUrl}>
            Get the Beta →
          </TrackedLink>
        </div>
      </div>
    </nav>
  );
}
