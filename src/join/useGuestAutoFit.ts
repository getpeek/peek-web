"use client";

// Fit once when the initial sync lands, and again on switching to a page whose
// camera was never moved — synced content otherwise sits off-screen (page
// viewports are per-peer and never sync, so a fresh guest starts at 0,0,1).

import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { activePageIdAtom, nodesAtom, viewportAtom } from "./canvas/state";

export function useGuestAutoFit(live: boolean): void {
  const rf = useReactFlow();
  const activePageId = useAtomValue(activePageIdAtom);
  const viewport = useAtomValue(viewportAtom);
  const nodeCount = useAtomValue(nodesAtom).length;
  const fittedPagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!live || !activePageId || nodeCount === 0) {
      return;
    }
    if (fittedPagesRef.current.has(activePageId)) {
      return;
    }
    fittedPagesRef.current.add(activePageId);
    const untouched = viewport.x === 0 && viewport.y === 0 && viewport.zoom === 1;
    if (!untouched) {
      return;
    }
    const timer = window.setTimeout(
      () => rf.fitView({ padding: 0.2, duration: 300, maxZoom: 1 }),
      120,
    );
    return () => window.clearTimeout(timer);
  }, [live, activePageId, nodeCount, viewport, rf]);
}
