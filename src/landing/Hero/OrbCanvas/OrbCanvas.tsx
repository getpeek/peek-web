"use client";

import { useRef } from "react";
import styles from "./OrbCanvas.module.css";
import { useOrbCanvas } from "./useOrbCanvas";

export function OrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useOrbCanvas(canvasRef);

  return (
    <div className={styles.wrap} aria-hidden='true'>
      <div className={styles.fallback} />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
