import { getLatestRelease } from "@/release/latestRelease";
import styles from "./Install.module.css";

export async function Install() {
  const release = await getLatestRelease();
  return (
    <div className={styles.grid}>
      <div className={styles.option}>
        <h3>Download the app</h3>
        <p className={styles.desc}>
          A signed, notarized <strong>.dmg</strong>
          {" for Apple Silicon. Drag Peek into Applications and you’re done."}
        </p>
        <div className={styles.spacer} />
        <a className={styles.downloadButton} href={release.downloadUrl}>
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d='M12 3v12m0 0l-4-4m4 4l4-4M5 21h14' />
          </svg>
          Download .dmg
        </a>
        <div className={styles.meta}>v{release.version} · Apple Silicon</div>
      </div>

      <div className={`${styles.option} ${styles.alt}`}>
        <h3>Build from source</h3>
        <p className={styles.desc}>
          Clone the repo and build the Tauri bundle yourself. Requires <strong>Rust</strong>,{" "}
          <strong>Node</strong>, and <strong>Yarn</strong>.
        </p>
        <div className={styles.spacer} />
        <div className={styles.codeWindow}>
          <div className={styles.codeBar}>
            <span className={styles.lights}>
              <i />
              <i />
              <i />
            </span>
            <span className={styles.codeTitle}>~/dev</span>
          </div>
          <pre>
            <span className={styles.prompt}>$ </span>
            <span className={styles.cmd}>git</span> clone{" "}
            <span className={styles.url}>git@github.com/getpeek/peek</span>
            {"\n\n"}
            <span className={styles.prompt}>$ </span>
            <span className={styles.cmd}>cd</span> peek
            {"\n\n"}
            <span className={styles.prompt}>$ </span>
            <span className={styles.cmd}>yarn</span> tauri <span className={styles.sub}>build</span>
          </pre>
        </div>
      </div>
    </div>
  );
}
