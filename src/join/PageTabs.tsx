"use client";

import { useAtomValue } from "jotai";
import { documentAtom } from "./canvas/state";
import { useCanvas } from "./canvas/hooks/useCanvas";
import styles from "./JoinCanvas.module.css";

export function PageTabs() {
  const doc = useAtomValue(documentAtom);
  const canvas = useCanvas();
  if (doc.pageOrder.length <= 1) {
    return null;
  }
  return (
    <div className={styles.tabs}>
      {doc.pageOrder.map(pageId => (
        <button
          key={pageId}
          type='button'
          className={pageId === doc.activePageId ? styles.tabActive : styles.tab}
          onClick={() => canvas.switchPage(pageId)}
        >
          {doc.pages[pageId]?.name || "Untitled"}
        </button>
      ))}
    </div>
  );
}
