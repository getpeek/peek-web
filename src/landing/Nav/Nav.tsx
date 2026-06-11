"use client";

import Link from "next/link";
import styles from "./Nav.module.css";
import Image from "next/image";
import { useScrolled } from "./useScrolled";

const githubUrl = "https://github.com/getpeek/peek";

type NavProps = {
  sticky?: boolean;
  currentPage?: "docs";
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
          <a href='/#features'>Features</a>
          <Link href='/docs' className={currentPage === "docs" ? styles.current : undefined}>
            Docs
          </Link>
          <a href='/#changelog'>Changelog</a>
          <a href={githubUrl} target='_blank' rel='noreferrer'>
            GitHub
          </a>
        </div>
        <a className={styles.ctaMini} href={downloadUrl}>
          Get the Beta →
        </a>
      </div>
    </nav>
  );
}
