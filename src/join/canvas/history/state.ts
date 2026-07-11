// Stub of the desktop `src/canvas/history/state.ts` — the web client has no
// on-disk history log, but ported canvas overlays read the preview atom to
// know whether a history scrub is being shown.

import { atom } from "jotai";
import type { AppEdge, AppNode, RegionState } from "../types";

export type PageSnapshot = {
  nodes: AppNode[];
  edges: AppEdge[];
  regions?: RegionState[];
};

export type HistoryPreview = {
  pageId: string;
  entryId: string;
  seq: number;
  takenAt: number;
  snapshot: PageSnapshot;
};

export const historyPreviewAtom = atom<HistoryPreview | null>(null);

export const historyPanelOpenAtom = atom(false);
