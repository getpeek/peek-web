"use client";

import { useAtomValue } from "jotai";
import { documentAtom } from "./canvas/state";
import { useCanvas } from "./canvas/hooks/useCanvas";
import { participantsAtom, sessionStateAtom } from "./multiplayer/state";
import type { Peer } from "./multiplayer/types";
import { PageTabAvatars } from "./PageTabAvatars";
import styles from "./JoinCanvas.module.css";

export function PageTabs() {
  const doc = useAtomValue(documentAtom);
  const session = useAtomValue(sessionStateAtom);
  const participants = useAtomValue(participantsAtom);
  const canvas = useCanvas();
  if (doc.pageOrder.length <= 1) {
    return null;
  }

  // Bucket peers by the page they're on so each tab shows who's viewing it.
  // Our own presence rides `sessionStateAtom` (never in `participants`), so seed
  // a self-peer on the active page like the desktop PageSelector does.
  const peersByPage = new Map<string, Peer[]>();
  if (session) {
    peersByPage.set(doc.activePageId, [
      {
        author: session.myAuthor,
        name: session.myName,
        color: session.myColor,
        isHost: session.role === "host",
        currentPageId: doc.activePageId,
        lastSeen: Date.now(),
      },
    ]);
    for (const peer of Object.values(participants)) {
      if (peer.author === session.myAuthor || !peer.currentPageId) {
        continue;
      }
      const list = peersByPage.get(peer.currentPageId);
      if (list) {
        list.push(peer);
      } else {
        peersByPage.set(peer.currentPageId, [peer]);
      }
    }
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
          <PageTabAvatars peers={peersByPage.get(pageId) ?? []} />
        </button>
      ))}
    </div>
  );
}
