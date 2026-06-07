"use client";

import { Panel, useStore } from "@xyflow/react";

import { RemoteCursor } from "./RemoteCursor";
import styles from "./RemoteCursor.module.css";

// Cursor position lives in flow coordinates so it tracks canvas content; the
// overlay converts to screen space each frame.
export type CursorState = { x: number; y: number; pressed?: boolean };

export function CollabOverlay({ cursor }: { cursor: CursorState | null }) {
  // Frame-accurate viewport transform (same source the product's cursor layer
  // reads) so the pointer stays glued to the canvas during camera pans.
  const [tx, ty, tz] = useStore(state => state.transform);

  if (!cursor) {
    return null;
  }

  const screenX = cursor.x * tz + tx;
  const screenY = cursor.y * tz + ty;

  return (
    <Panel position='top-left' className={styles.layer}>
      <div className={styles.anchor} style={{ transform: `translate(${screenX}px, ${screenY}px)` }}>
        <RemoteCursor pressed={cursor.pressed} />
      </div>
    </Panel>
  );
}
