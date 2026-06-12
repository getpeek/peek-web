import type { Metadata } from "next";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";
import Image from "next/image";

export const metadata: Metadata = { title: "Themes" };

export default function ThemesPage() {
  return (
    <>
      <h1 className={styles.title}>Themes</h1>
      <p className={styles.lede}>
        Peek currently offers three themes, Pine, Midnight and Midday, with some more options on the
        way.
      </p>

      <Image
        className={styles.fullImage}
        src='/features/themes/pine.png'
        alt='Pine theme'
        width={1168}
        height={657}
      />

      <Image
        className={styles.fullImage}
        src='/features/themes/midnight.png'
        alt='Midnight theme'
        width={1168}
        height={657}
      />

      <Image
        className={styles.fullImage}
        src='/features/themes/midday.png'
        alt='Midday theme'
        width={1168}
        height={657}
      />
    </>
  );
}
