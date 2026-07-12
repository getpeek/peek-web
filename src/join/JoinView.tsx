"use client";

import { useAtomValue } from "jotai";
import { JoinCanvas } from "./JoinCanvas";
import { initialFromName } from "./identity";
import { guestErrorAtom, guestStatusAtom, participantsAtom } from "./multiplayer/state";
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
  const busy = status === "connecting" || status === "syncing";
  const peerList = Object.values(peers);

  return (
    <div className={styles.root}>
      <JoinCanvas />

      <div className={styles.topbar}>
        <div className={`${styles.status} ${styles[status]}`}>
          <span className={styles.dot} />
          {STATUS_LABEL[status] ?? status}
        </div>
        <div className={styles.avatars}>
          {peerList.map(peer => (
            <span
              key={peer.author}
              className={styles.avatar}
              style={{ background: peer.color }}
              title={peer.isHost ? `${peer.name} (host)` : peer.name}
            >
              {initialFromName(peer.name)}
            </span>
          ))}
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
