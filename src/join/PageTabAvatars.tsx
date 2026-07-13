import { initialFromName } from "./identity";
import type { Peer } from "./multiplayer/types";
import { Tooltip } from "./components/Tooltip/Tooltip";
import styles from "./JoinCanvas.module.css";

const MAX_AVATARS = 3;

interface Props {
  peers: Peer[];
}

export function PageTabAvatars({ peers }: Props) {
  if (peers.length === 0) {
    return null;
  }
  const visible = peers.slice(0, MAX_AVATARS);
  const overflow = peers.length - visible.length;

  return (
    <span className={styles.pageTabAvatars} aria-hidden>
      {visible.map(peer => (
        <Tooltip key={peer.author} label={peer.name} position='bottom'>
          <span className={styles.pageTabAvatar} style={{ backgroundColor: peer.color }}>
            {initialFromName(peer.name)}
          </span>
        </Tooltip>
      ))}
      {overflow > 0 && (
        <span className={`${styles.pageTabAvatar} ${styles.pageTabAvatarOverflow}`}>
          +{overflow}
        </span>
      )}
    </span>
  );
}
