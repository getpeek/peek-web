import styles from "./Starfield.module.css";

export function Starfield() {
  return (
    <>
      <div className={styles.universe} aria-hidden='true' />
      <div className={`${styles.nebula} ${styles.n1}`} aria-hidden='true' />
      <div className={`${styles.nebula} ${styles.n2}`} aria-hidden='true' />
      <div className={`${styles.nebula} ${styles.n3}`} aria-hidden='true' />
    </>
  );
}
