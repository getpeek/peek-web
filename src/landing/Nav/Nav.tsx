import Link from "next/link";
import styles from "./Nav.module.css";
import Image from "next/image";

const githubUrl = "https://github.com/getpeek/peek";

export function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <Link href="/">
          <Image width={48} height={48} src="/logo.png" alt="Peek" />
        </Link>
      </div>
      <div className={styles.links}>
        <a href="#features">Features</a>
        <a href="#docs">Docs</a>
        <a href="#changelog">Changelog</a>
        <a href={githubUrl} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
      <a className={styles.ctaMini} href="#beta">
        Get the Beta →
      </a>
    </nav>
  );
}
