// Port of the desktop `src/canvas/state.ts`, with two guest-specific changes:
// the document starts empty (no local page — the host's pages stream in), and
// the page-lens atoms tolerate the pre-sync window where no active page exists.

import { atom } from "jotai";
import { atomFamily, selectAtom } from "jotai/utils";
import type {
  AppEdge,
  AppNode,
  AppNodeType,
  CanvasDocument,
  PageState,
  RegionState,
  Viewport,
} from "./types";
import type { DatabaseResult } from "../state";

// The guest never authors its own document — everything arrives from the host,
// so the doc starts with no pages and an empty active id until sync fills it.
function emptyGuestDocument(): CanvasDocument {
  return { version: 1, activePageId: "", pageOrder: [], pages: {} };
}

const _documentBaseAtom = atom<CanvasDocument>(emptyGuestDocument());

// Synchronous gate that suppresses outbound sync emissions while we're
// applying a change received from a remote peer. A ref (not an atom) because
// the documentAtom setter needs to read the latest value within the same
// JS turn — atom propagation through React's render cycle isn't fast enough.
export const isApplyingRemoteRef = { current: false };

export type DocumentMutationListener = (prev: CanvasDocument, next: CanvasDocument) => void;

const _documentMutationListeners = new Set<DocumentMutationListener>();

export function subscribeDocumentMutations(fn: DocumentMutationListener): () => void {
  _documentMutationListeners.add(fn);
  return () => {
    _documentMutationListeners.delete(fn);
  };
}

export const documentAtom = atom(
  get => get(_documentBaseAtom),
  (get, set, updater: CanvasDocument | ((prev: CanvasDocument) => CanvasDocument)) => {
    const prev = get(_documentBaseAtom);
    const next =
      typeof updater === "function"
        ? (updater as (p: CanvasDocument) => CanvasDocument)(prev)
        : updater;
    set(_documentBaseAtom, next);
    if (!isApplyingRemoteRef.current && prev !== next) {
      for (const fn of _documentMutationListeners) {
        try {
          fn(prev, next);
        } catch (e) {
          console.error("documentMutationListener error:", e);
        }
      }
    }
  },
);

// Per-result-node query rows, keyed by result node id. Held out-of-band from
// the canvas document. Unlike the desktop there is no mutation-listener
// wrapper: a guest never authors results, it only receives them.
export const resultsAtom = atom<Record<string, DatabaseResult>>({});

const EMPTY_RESULT: DatabaseResult = [];

// Per-node view of `resultsAtom`. A result node subscribes to its own rows so
// that one node receiving query results doesn't re-render every other result
// node on the page. The stable `EMPTY_RESULT` keeps the no-rows case from
// looking like a change on every unrelated write.
export const resultRowsAtom = atomFamily((id: string) =>
  selectAtom(resultsAtom, results => results[id] ?? EMPTY_RESULT),
);

export interface ResultFindState {
  active: boolean;
  query: string;
  // Whether the find input should grab focus on open. True when the user opens
  // find directly; false when page search drives it, so it doesn't steal focus
  // from the page-search input.
  autoFocus: boolean;
}

export const NO_FIND: ResultFindState = { active: false, query: "", autoFocus: false };

// In-result find mode ("search the result's cells"), keyed by result-node id.
// Session-only and held out-of-band from the document on purpose: find mode is
// ephemeral UI, so it must not enter multiplayer sync.
export const resultFindAtom = atomFamily((_id: string) => atom<ResultFindState>(NO_FIND));

// Pre-sync there is no active page yet; a stable empty stand-in keeps every
// page-lens consumer null-safe without per-call guards.
const EMPTY_PAGE: PageState = {
  id: "",
  name: "",
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export const activePageAtom = atom<PageState>(get => {
  const doc = get(documentAtom);
  return doc.pages[doc.activePageId] ?? EMPTY_PAGE;
});

export const activePageIdAtom = atom<string>(get => get(documentAtom).activePageId);

type Updater<T> = T | ((prev: T) => T);

function applyUpdater<T>(prev: T, updater: Updater<T>): T {
  return typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
}

export const nodesAtom = atom(
  get => get(activePageAtom).nodes,
  (get, set, updater: Updater<AppNode[]>) => {
    const doc = get(documentAtom);
    const page = doc.pages[doc.activePageId];
    if (!page) {
      return;
    }
    const next = applyUpdater(page.nodes, updater);
    set(documentAtom, {
      ...doc,
      pages: {
        ...doc.pages,
        [doc.activePageId]: { ...page, nodes: next },
      },
    });
  },
);

export const edgesAtom = atom(
  get => get(activePageAtom).edges,
  (get, set, updater: Updater<AppEdge[]>) => {
    const doc = get(documentAtom);
    const page = doc.pages[doc.activePageId];
    if (!page) {
      return;
    }
    const next = applyUpdater(page.edges, updater);
    set(documentAtom, {
      ...doc,
      pages: {
        ...doc.pages,
        [doc.activePageId]: { ...page, edges: next },
      },
    });
  },
);

const NO_REGIONS: RegionState[] = [];

export const regionsAtom = atom(
  get => get(activePageAtom).regions ?? NO_REGIONS,
  (get, set, updater: Updater<RegionState[]>) => {
    const doc = get(documentAtom);
    const page = doc.pages[doc.activePageId];
    if (!page) {
      return;
    }
    const next = applyUpdater(page.regions ?? NO_REGIONS, updater);
    set(documentAtom, {
      ...doc,
      pages: {
        ...doc.pages,
        [doc.activePageId]: { ...page, regions: next },
      },
    });
  },
);

export const viewportAtom = atom(
  get => get(activePageAtom).viewport,
  (get, set, updater: Updater<Viewport>) => {
    const doc = get(documentAtom);
    const page = doc.pages[doc.activePageId];
    if (!page) {
      return;
    }
    const next = applyUpdater(page.viewport, updater);
    set(documentAtom, {
      ...doc,
      pages: {
        ...doc.pages,
        [doc.activePageId]: { ...page, viewport: next },
      },
    });
  },
);

export const placeModeAtom = atom<AppNodeType | null>(null);

export const selectionToolAtom = atom<"default" | "lasso">("default");

// Freezes canvas pan/zoom (node dragging/selection stay enabled). Session-only.
export const cameraLockedAtom = atom(false);

// Aggregates for the active all-numeric cell selection in a Result node,
// displayed in that node's own toolbar in place of the row/table meta.
export type CellSelectionSummary = {
  nodeId: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
};

export const cellSelectionSummaryAtom = atom<CellSelectionSummary | null>(null);

export const clipboardAtom = atom<AppNode[]>([]);

export type HistorySnapshot = { nodes: AppNode[]; edges: AppEdge[]; regions: RegionState[] };
export type PageHistory = { past: HistorySnapshot[]; future: HistorySnapshot[] };

export const historyAtom = atom<Record<string, PageHistory>>({});

export const pendingPageCloseAtom = atom<{ pageId: string } | null>(null);

export const loadEpochAtom = atom(0);

export interface CanvasApi {
  addNode: (node: AppNode) => void;
  updateNode: (id: string, patch: Partial<AppNode> | ((n: AppNode) => AppNode)) => void;
  updateNodeData: <D extends object = Record<string, unknown>>(
    id: string,
    patch: Partial<D> | ((d: D) => D),
  ) => void;
  deleteNode: (id: string) => void;
  connect: (source: string, target: string, opts?: Partial<AppEdge>) => void;

  getNode: (id: string) => AppNode | undefined;
  getNodes: () => AppNode[];
  getEdges: () => AppEdge[];
  getSelectedNodes: () => AppNode[];

  selectOnly: (idOrIds: string | string[]) => void;
  deselectAll: () => void;

  zoomToNode: (id: string, opts?: { duration?: number }) => void;
  zoomToNodes: (ids: string[], opts?: { duration?: number; padding?: number }) => void;
  fitNode: (id: string, opts?: { duration?: number }) => void;
  panToNode: (id: string, opts?: { duration?: number; zoom?: number }) => void;
  panToPoint: (x: number, y: number, opts?: { duration?: number; zoom?: number }) => void;
  fitView: (opts?: { duration?: number; maxZoom?: number }) => void;
  fitSelectedToViewport: () => void;
  resetZoom: () => void;
  setZoom: (zoom: number, opts?: { duration?: number }) => void;
  getZoom: () => number;
  screenToFlowPosition: (p: { x: number; y: number }) => {
    x: number;
    y: number;
  };

  switchPage: (id: string) => void;
  addPage: (name?: string) => string;
  renamePage: (id: string, name: string) => void;
  deletePage: (id: string) => void;
  reorderPage: (id: string, toIndex: number) => void;
}

export const canvasApiAtom = atom<CanvasApi | null>(null);
