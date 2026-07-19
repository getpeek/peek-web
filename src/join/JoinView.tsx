"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { JoinCanvas } from "./JoinCanvas";
import { canvasApiAtom, documentAtom } from "./canvas/state";
import { initialFromName } from "./identity";
import {
  followingAuthorAtom,
  guestErrorAtom,
  guestStatusAtom,
  participantsAtom,
} from "./multiplayer/state";
import type { Peer } from "./multiplayer/types";
import { useGuestSyncBridge } from "./multiplayer/useGuestSyncBridge";
import styles from "./JoinView.module.css";

const STATUS_LABEL: Record<string, string> = {
  connecting: "Connecting…",
  syncing: "Syncing canvas…",
  live: "Live",
  disconnected: "Host disconnected — waiting…",
  error: "Connection failed",
};

export function JoinView({ ticket }: { ticket: string }) {
  useGuestSyncBridge(ticket);
  const status = useAtomValue(guestStatusAtom);
  const error = useAtomValue(guestErrorAtom);
  const peers = useAtomValue(participantsAtom);
  const doc = useAtomValue(documentAtom);
  const canvasApi = useAtomValue(canvasApiAtom);
  const following = useAtomValue(followingAuthorAtom);
  const setFollowing = useSetAtom(followingAuthorAtom);
  const busy = status === "connecting" || status === "syncing";
  const peerList = Object.values(peers);

  // Clicking an avatar toggles follow-mode; `useFollowPeer` drives the camera
  // (initial jump + continuous tracking + page-follow). Switching page here is
  // just immediate feedback.
  const handlePeerClick = (peer: Peer) => {
    if (!canvasApi || !doc.pages[peer.currentPageId]) {
      return;
    }
    if (following === peer.author) {
      setFollowing(null);
      return;
    }
    setFollowing(peer.author);
    canvasApi.switchPage(peer.currentPageId);
  };

  return (
    <div className={styles.root}>
      <JoinCanvas />

      <div className={styles.topbar}>
        <div className={`${styles.status} ${styles[status]}`}>
          <span className={styles.dot} />
          {STATUS_LABEL[status] ?? status}
        </div>
        <div className={styles.avatars}>
          {peerList.map(peer => {
            const known = !!doc.pages[peer.currentPageId];
            const isFollowing = following === peer.author;
            const title = isFollowing
              ? `Stop following ${peer.name}`
              : known
                ? `Follow ${peer.name}`
                : peer.isHost
                  ? `${peer.name} (host)`
                  : peer.name;
            return (
              <button
                type='button'
                key={peer.author}
                className={`${styles.avatar} ${isFollowing ? styles.avatarFollowing : ""}`}
                style={{ background: peer.color }}
                title={title}
                onClick={() => handlePeerClick(peer)}
                disabled={!known}
              >
                {initialFromName(peer.name)}
              </button>
            );
          })}
        </div>
      </div>

      {busy ? (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <div>{STATUS_LABEL[status]}</div>
        </div>
      ) : null}

      {status === "error" ? (
        <div className={styles.overlay}>
          <div className={styles.errorTitle}>Couldn’t join this session</div>
          <div className={styles.errorMsg}>{error}</div>
          <div className={styles.hint}>
            The link may have expired, or the host ended the session.
          </div>
        </div>
      ) : null}
    </div>
  );
}
