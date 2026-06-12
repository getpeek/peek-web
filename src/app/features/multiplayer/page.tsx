import type { Metadata } from "next";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Multiplayer" };

export default function MultiplayerPage() {
  return (
    <>
      <h1 className={styles.title}>Multiplayer</h1>
      <p className={styles.lede}>
        Explore together. Live cursors, shared canvases, and branching side-by-side with your team —
        fully peer-to-peer, so your data never touches a server.
      </p>
      <div className={styles.placeholder}>Design this section next — multiplayer demo</div>
    </>
  );
}
