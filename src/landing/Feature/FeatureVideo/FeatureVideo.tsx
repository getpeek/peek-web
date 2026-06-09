"use client";

import { useRef, useState } from "react";
import styles from "./FeatureVideo.module.css";

type FeatureVideoProps = {
  src?: string;
  poster?: string;
  label?: string;
};

export function FeatureVideo({ src, poster, label = "Play demo video" }: FeatureVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    videoRef.current?.play();
    setPlaying(true);
  };

  if (!src) {
    return (
      <div className={styles.frame}>
        <span className={styles.comingSoon}>Demo coming soon</span>
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        playsInline
        preload='metadata'
        controls={playing}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <button
          type='button'
          className={`${styles.playButton} pk-shimmer`}
          onClick={play}
          aria-label={label}
        >
          <svg viewBox='0 0 24 24' width='22' height='22' aria-hidden='true'>
            <path d='M8 5.5v13l11-6.5z' fill='currentColor' />
          </svg>
        </button>
      )}
    </div>
  );
}
