"use client";

import { ANNA } from "../data";
import styles from "./RemoteCursor.module.css";

// Presentational pointer for the demo's remote collaborator. Position is owned
// by CollabOverlay (screen space); this just draws the arrow + name pill.
export function RemoteCursor({ pressed }: { pressed?: boolean }) {
  return (
    <div className={`${styles.cursor} ${pressed ? styles.pressed : ""}`}>
      <svg className={styles.pointer} viewBox='0 0 24 24' aria-hidden='true'>
        <path
          d='M4 3 L4 19 L8.2 15.1 L11 21.2 L13.4 20.1 L10.6 14.1 L16 14 Z'
          fill='currentColor'
          stroke='rgba(0, 0, 0, 0.35)'
          strokeWidth={1}
          strokeLinejoin='round'
        />
      </svg>
      <span className={styles.label}>{ANNA.name}</span>
    </div>
  );
}
