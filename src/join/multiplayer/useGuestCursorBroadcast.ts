"use client";

// Web counterpart of the desktop `useCursorBroadcast`: same ~15 Hz throttle
// and the same wire payloads, sent through the wasm session instead of Tauri.
// Also owns the presence heartbeat and the leave signal on tab close.

import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { getDefaultStore } from "jotai";
import { activePageIdAtom } from "../canvas/state";
import { guestIdentityAtom, guestSessionAtom } from "./state";

const CURSOR_BROADCAST_MS = 66;
const PRESENCE_HEARTBEAT_MS = 5000;

export function useGuestCursorBroadcast(): void {
  const session = useAtomValue(guestSessionAtom);
  const identity = useAtomValue(guestIdentityAtom);
  const rf = useReactFlow();
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }
    let last = 0;
    let frame: number | null = null;
    const flush = () => {
      frame = null;
      const pos = lastPosRef.current;
      if (!pos) {
        return;
      }
      const flow = rf.screenToFlowPosition(pos);
      last = Date.now();
      // Read the page synchronously at flush time so a page switch mid-flight
      // doesn't tag the cursor with a stale page.
      const pageId = getDefaultStore().get(activePageIdAtom);
      session
        .sendGossip(JSON.stringify({ type: "cursor", flowX: flow.x, flowY: flow.y, pageId }))
        .catch(() => {});
    };
    const onMove = (e: MouseEvent) => {
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      const elapsed = Date.now() - last;
      if (elapsed >= CURSOR_BROADCAST_MS) {
        flush();
      } else if (frame === null) {
        frame = window.setTimeout(flush, CURSOR_BROADCAST_MS - elapsed);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame !== null) {
        window.clearTimeout(frame);
      }
    };
  }, [session, rf]);

  const activePageId = useAtomValue(activePageIdAtom);

  useEffect(() => {
    if (!session || !identity) {
      return;
    }
    const send = () => {
      session
        .sendGossip(
          JSON.stringify({
            type: "presence",
            name: identity.myName,
            color: identity.myColor,
            isHost: false,
            pageId: activePageId,
          }),
        )
        .catch(() => {});
    };
    send();
    const heartbeat = window.setInterval(send, PRESENCE_HEARTBEAT_MS);
    return () => window.clearInterval(heartbeat);
  }, [session, identity, activePageId]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const onBeforeUnload = () => {
      session.sendGossip(JSON.stringify({ type: "leave" })).catch(() => {});
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [session]);
}
