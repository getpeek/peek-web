"use client";

// Web counterpart of the desktop `useViewportBroadcast`: broadcasts the local
// camera (flow-space pane center + zoom) through the wasm session, throttled at
// ~15 Hz with an idle heartbeat. Returns a handler for React Flow's `onMove`.

import { useReactFlow, type Viewport } from "@xyflow/react";
import { getDefaultStore, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { activePageIdAtom } from "../canvas/state";
import { guestSessionAtom } from "./state";

const VIEWPORT_BROADCAST_MS = 66;
const VIEWPORT_HEARTBEAT_MS = 5000;

export function useGuestViewportBroadcast(): (viewport: Viewport) => void {
  const session = useAtomValue(guestSessionAtom);
  const rf = useReactFlow();
  const lastSentRef = useRef(0);
  const lastViewportRef = useRef<Viewport | null>(null);
  const frameRef = useRef<number | null>(null);

  const send = useCallback(
    (vp: Viewport) => {
      if (!session) {
        return;
      }
      const rect = document.querySelector<HTMLElement>(".react-flow")?.getBoundingClientRect();
      const width = rect?.width ?? window.innerWidth;
      const height = rect?.height ?? window.innerHeight;
      const centerX = (width / 2 - vp.x) / vp.zoom;
      const centerY = (height / 2 - vp.y) / vp.zoom;
      const pageId = getDefaultStore().get(activePageIdAtom);
      lastSentRef.current = Date.now();
      session
        .sendGossip(JSON.stringify({ type: "viewport", centerX, centerY, zoom: vp.zoom, pageId }))
        .catch(() => {});
    },
    [session],
  );

  const broadcast = useCallback(
    (vp: Viewport) => {
      lastViewportRef.current = vp;
      const elapsed = Date.now() - lastSentRef.current;
      if (elapsed >= VIEWPORT_BROADCAST_MS) {
        send(vp);
      } else if (frameRef.current === null) {
        frameRef.current = window.setTimeout(() => {
          frameRef.current = null;
          if (lastViewportRef.current) {
            send(lastViewportRef.current);
          }
        }, VIEWPORT_BROADCAST_MS - elapsed);
      }
    },
    [send],
  );

  useEffect(() => {
    if (!session) {
      return;
    }
    send(rf.getViewport());
    const heartbeat = window.setInterval(() => send(rf.getViewport()), VIEWPORT_HEARTBEAT_MS);
    return () => {
      window.clearInterval(heartbeat);
      if (frameRef.current !== null) {
        window.clearTimeout(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [session, rf, send]);

  return broadcast;
}
