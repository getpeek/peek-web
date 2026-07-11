// Guest-session atoms. Exports the desktop `src/multiplayer/state.ts` names
// (sessionStateAtom, participantsAtom, remoteCursorsAtom) so ported components
// compile verbatim, plus the web-only guest status/session handles.

import { atom } from "jotai";
import type { PeekJoinSession } from "../wasmClient";
import type { Peer, RemoteCursor, SessionState } from "./types";

export type GuestStatus = "connecting" | "syncing" | "live" | "disconnected" | "error";

export const guestStatusAtom = atom<GuestStatus>("connecting");

export const guestErrorAtom = atom<string | null>(null);

// The live wasm session handle — actions (exec/gossip/doc writes) go through
// it. Held in an atom so nodes and hooks reach it without prop-drilling.
export const guestSessionAtom = atom<PeekJoinSession | null>(null);

const GUEST_STATUS_TO_SESSION: Record<GuestStatus, SessionState["status"]> = {
  connecting: "connecting",
  syncing: "connecting",
  live: "active",
  disconnected: "reconnecting",
  error: "ending",
};

export interface GuestIdentity {
  myAuthor: string;
  myName: string;
  myColor: string;
  ticket: string;
}

export const guestIdentityAtom = atom<GuestIdentity | null>(null);

// Desktop-shaped session state derived from the guest atoms. Ported components
// key off `role === "joiner"` and `status !== "active"`, both of which map
// cleanly onto the guest lifecycle.
export const sessionStateAtom = atom<SessionState | null>(get => {
  const identity = get(guestIdentityAtom);
  if (!identity) {
    return null;
  }
  return {
    role: "joiner",
    status: GUEST_STATUS_TO_SESSION[get(guestStatusAtom)],
    ticket: identity.ticket,
    myAuthor: identity.myAuthor,
    myColor: identity.myColor,
    myName: identity.myName,
  };
});

export const participantsAtom = atom<Record<string, Peer>>({});

export const remoteCursorsAtom = atom<Record<string, RemoteCursor>>({});

export interface MultiplayerSyncIssue {
  count: number;
  lastError: { kind: "put" | "del"; key: string; message: string; at: number } | null;
}

export const multiplayerSyncIssueAtom = atom<MultiplayerSyncIssue>({
  count: 0,
  lastError: null,
});
