"use client";

// The guest session driver: joins from a ticket, applies the inbound doc
// stream into the jotai document/results atoms (gated so remote applies never
// re-emit as outbound puts), and pushes local document mutations back to the
// host as doc operations — the web equivalent of the desktop `useSyncBridge`.

import { getDefaultStore } from "jotai";
import { useEffect } from "react";
import {
  documentAtom,
  isApplyingRemoteRef,
  resultsAtom,
  subscribeDocumentMutations,
} from "../canvas/state";
import { schemaAtom, type Schema } from "../state";
import { colorFromName } from "../identity";
import { joinSession, type GuestEvent, type PeekJoinSession } from "../wasmClient";
import { applyOperation, applyResultOperation } from "./diffApply";
import { diffDocs, keyKind } from "./diff";
import { handleAgentGossip, handleAgentRequestDelete } from "./agentProxy";
import { handleLspResponse } from "./lspProxy";
import {
  followingAuthorAtom,
  guestErrorAtom,
  guestIdentityAtom,
  guestSessionAtom,
  guestStatusAtom,
  multiplayerSyncIssueAtom,
  participantsAtom,
  remoteCursorsAtom,
  remoteViewportsAtom,
} from "./state";
import type { Operation } from "./types";

const PEER_STALE_MS = 15000;
// Cursor traffic proves a peer is alive; refresh presence at most this often
// so a busy cursor doesn't churn the participants atom sixty times a second.
const CURSOR_LIVENESS_THROTTLE_MS = 2000;

type Store = ReturnType<typeof getDefaultStore>;

function applyDocOperation(store: Store, op: Operation): void {
  isApplyingRemoteRef.current = true;
  try {
    store.set(documentAtom, d => applyOperation(d, op));
  } finally {
    isApplyingRemoteRef.current = false;
  }
}

// exec/agent/lsp request keys are host-side concerns on the way in; they fall
// through both routers untouched.
function routeEntry(store: Store, key: string, value: string): void {
  const kind = keyKind(key);
  if (kind === "doc") {
    applyDocOperation(store, { kind: "put", key, value });
  } else if (kind === "result") {
    store.set(resultsAtom, r => applyResultOperation(r, { kind: "put", key, value }));
  } else if (kind === "lsp-response") {
    handleLspResponse(key, value);
  } else if (kind === "schema") {
    try {
      store.set(schemaAtom, JSON.parse(value) as Schema);
    } catch {}
  }
}

function routeDelete(store: Store, key: string): void {
  const kind = keyKind(key);
  if (kind === "doc") {
    applyDocOperation(store, { kind: "del", key });
  } else if (kind === "result") {
    store.set(resultsAtom, r => applyResultOperation(r, { kind: "del", key }));
  } else if (kind === "agent-request") {
    // The host deletes the request key when the run ends.
    handleAgentRequestDelete(key);
  }
}

function handleGossip(store: Store, author: string, payload: Record<string, unknown>): void {
  const now = Date.now();
  const type = payload.type;
  if (type === "cursor") {
    const flowX = Number(payload.flowX);
    const flowY = Number(payload.flowY);
    const pageId = typeof payload.pageId === "string" ? payload.pageId : "";
    if (!Number.isFinite(flowX) || !Number.isFinite(flowY) || !pageId) {
      return;
    }
    store.set(remoteCursorsAtom, prev => ({
      ...prev,
      [author]: { flowX, flowY, pageId, updatedAt: now },
    }));
    const peers = store.get(participantsAtom);
    const peer = peers[author];
    if (peer && now - peer.lastSeen > CURSOR_LIVENESS_THROTTLE_MS) {
      store.set(participantsAtom, { ...peers, [author]: { ...peer, lastSeen: now } });
    }
    return;
  }
  if (type === "viewport") {
    const centerX = Number(payload.centerX);
    const centerY = Number(payload.centerY);
    const zoom = Number(payload.zoom);
    const pageId = typeof payload.pageId === "string" ? payload.pageId : "";
    if (!Number.isFinite(centerX) || !Number.isFinite(centerY) || !zoom || !pageId) {
      return;
    }
    store.set(remoteViewportsAtom, prev => ({
      ...prev,
      [author]: { centerX, centerY, zoom, pageId, updatedAt: now },
    }));
    const peers = store.get(participantsAtom);
    const peer = peers[author];
    if (peer && now - peer.lastSeen > CURSOR_LIVENESS_THROTTLE_MS) {
      store.set(participantsAtom, { ...peers, [author]: { ...peer, lastSeen: now } });
    }
    return;
  }
  if (type === "presence") {
    store.set(participantsAtom, prev => ({
      ...prev,
      [author]: {
        author,
        name: typeof payload.name === "string" ? payload.name : "Peer",
        color: typeof payload.color === "string" ? payload.color : "#888",
        isHost: Boolean(payload.isHost),
        currentPageId: typeof payload.pageId === "string" ? payload.pageId : "",
        lastSeen: now,
      },
    }));
    return;
  }
  if (type === "leave") {
    store.set(participantsAtom, prev => {
      if (!(author in prev)) {
        return prev;
      }
      const { [author]: _gone, ...rest } = prev;
      return rest;
    });
    store.set(remoteCursorsAtom, prev => {
      if (!(author in prev)) {
        return prev;
      }
      const { [author]: _gone, ...rest } = prev;
      return rest;
    });
    store.set(remoteViewportsAtom, prev => {
      if (!(author in prev)) {
        return prev;
      }
      const { [author]: _gone, ...rest } = prev;
      return rest;
    });
    return;
  }
  if (type === "agent-stream" || type === "agent-stream-end") {
    handleAgentGossip(payload);
  }
}

function pushOperation(store: Store, session: PeekJoinSession, op: Operation): void {
  const push = op.kind === "put" ? session.docPut(op.key, op.value) : session.docDel(op.key);
  push.catch((e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    store.set(multiplayerSyncIssueAtom, prev => ({
      count: prev.count + 1,
      lastError: { kind: op.kind, key: op.key, message, at: Date.now() },
    }));
  });
}

function pruneByTimestamp<T>(
  prev: Record<string, T>,
  timestamp: (v: T) => number,
  cutoff: number,
): Record<string, T> {
  let changed = false;
  const next: Record<string, T> = {};
  for (const [author, v] of Object.entries(prev)) {
    if (timestamp(v) >= cutoff) {
      next[author] = v;
    } else {
      changed = true;
    }
  }
  return changed ? next : prev;
}

function pruneStalePeers(store: Store): void {
  const cutoff = Date.now() - PEER_STALE_MS;
  store.set(participantsAtom, prev => pruneByTimestamp(prev, p => p.lastSeen, cutoff));
  store.set(remoteCursorsAtom, prev => pruneByTimestamp(prev, c => c.updatedAt, cutoff));
  store.set(remoteViewportsAtom, prev => pruneByTimestamp(prev, v => v.updatedAt, cutoff));
}

export function useGuestSyncBridge(ticket: string): void {
  useEffect(() => {
    const store = getDefaultStore();
    let cancelled = false;
    let active: PeekJoinSession | null = null;
    let reader: ReadableStreamDefaultReader<GuestEvent> | null = null;
    let unsubscribeMutations: (() => void) | null = null;

    const handle = (event: GuestEvent, selfAuthor: string) => {
      switch (event.type) {
        case "entry":
          routeEntry(store, event.key, event.value);
          break;
        case "delete":
          routeDelete(store, event.key);
          break;
        case "syncFinished":
          store.set(guestStatusAtom, "live");
          break;
        case "peerDown":
          store.set(guestStatusAtom, "disconnected");
          break;
        case "peerUp":
          store.set(guestStatusAtom, "live");
          break;
        case "gossip":
          if (event.author !== selfAuthor) {
            handleGossip(store, event.author, event.payload);
          }
          break;
      }
    };

    (async () => {
      try {
        const joined = await joinSession(ticket);
        if (cancelled) {
          joined.free();
          return;
        }
        active = joined;
        const myAuthor = joined.endpointId();
        store.set(guestIdentityAtom, {
          myAuthor,
          myName: `Guest ${myAuthor.slice(0, 4) || "?"}`,
          myColor: colorFromName(myAuthor || "guest"),
          ticket,
        });
        store.set(guestSessionAtom, joined);
        store.set(guestStatusAtom, "syncing");

        // Local document mutations (the remote-apply gate keeps inbound
        // changes out of this path) diff into per-key ops and push to the doc.
        unsubscribeMutations = subscribeDocumentMutations((prev, next) => {
          for (const op of diffDocs(prev, next)) {
            pushOperation(store, joined, op);
          }
        });

        reader = joined.events().getReader();
        for (;;) {
          const { value, done } = await reader.read();
          if (done || cancelled) {
            break;
          }
          if (value) {
            handle(value, myAuthor);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[peek-join] session error:", e);
          store.set(guestErrorAtom, e instanceof Error ? e.message : String(e));
          store.set(guestStatusAtom, "error");
        }
      }
    })();

    const prune = window.setInterval(() => pruneStalePeers(store), 5000);

    return () => {
      cancelled = true;
      window.clearInterval(prune);
      unsubscribeMutations?.();
      reader?.cancel().catch(() => {});
      active?.free();
      store.set(guestSessionAtom, null);
      store.set(guestStatusAtom, "connecting");
      store.set(guestErrorAtom, null);
      store.set(participantsAtom, {});
      store.set(remoteCursorsAtom, {});
      store.set(remoteViewportsAtom, {});
      store.set(followingAuthorAtom, null);
    };
  }, [ticket]);
}
