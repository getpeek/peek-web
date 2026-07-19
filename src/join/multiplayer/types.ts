// Desktop `src/multiplayer/types.ts` shapes, with one web difference: doc
// values travel as decoded strings (the wasm client UTF-8-decodes blobs), so
// `Operation.value` is a string rather than a Uint8Array.

export type Role = "host" | "joiner";

export type SessionStatus = "connecting" | "active" | "reconnecting" | "ending";

export interface SessionState {
  role: Role;
  status: SessionStatus;
  ticket: string;
  myAuthor: string;
  myColor: string;
  myName: string;
}

export interface Peer {
  author: string;
  name: string;
  color: string;
  isHost: boolean;
  currentPageId: string;
  lastSeen: number;
}

export interface RemoteCursor {
  flowX: number;
  flowY: number;
  pageId: string;
  updatedAt: number;
}

// A peer's camera: the flow-space center of their pane plus their zoom.
// Pane-size independent; broadcast ephemerally over gossip for follow-mode.
export interface RemoteViewport {
  centerX: number;
  centerY: number;
  zoom: number;
  pageId: string;
  updatedAt: number;
}

export type Operation = { kind: "put"; key: string; value: string } | { kind: "del"; key: string };
