import styles from "./Hero.module.css";
import { OrbCanvas } from "./OrbCanvas/OrbCanvas";

export function Hero() {
  return (
    <section className={styles.hero}>
      <svg className={styles.rings} viewBox="0 0 1400 1400" aria-hidden="true">
        <circle cx="700" cy="700" r="280" />
        <circle cx="700" cy="700" r="440" />
        <circle cx="700" cy="700" r="600" />
      </svg>

      <div className={styles.heroMeta}>
        <div className={styles.left}>v2.5.3 · beta</div>
        <div className={styles.right}>Database GUI</div>
      </div>

      <div className={styles.wordmarkWrap}>
        <OrbCanvas />
        <h1 className={styles.wordmark}>Peek</h1>
      </div>

      <p className={styles.tagline}>
        A GUI database client for people who think in <em>2D</em>. Explore, edit, chart and chat
        with your data on an infinite canvas.
      </p>

      <div className={styles.heroCta}>
        <a className={styles.cta} href="#beta">
          <span>Get the Beta</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      <div className={styles.heroFoot}>
        <span>Postgres</span>
        <span className={styles.dot}>·</span>
        <span>MySQL</span>
        <span className={styles.dot}>·</span>
        <span>SQLite</span>
        <span className={styles.dot}>·</span>
        <span>ClickHouse</span>
        <span className={styles.dot}>·</span>
        <span>DuckDB</span>
      </div>
    </section>
  );
}
