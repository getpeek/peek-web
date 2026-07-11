// Loads the `peek-join` wasm guest client (built by `yarn build:wasm` into
// /public/peek-join). We load it via a runtime dynamic import of the public URL
// so the bundler never tries to inline the 4.6 MB wasm — the browser fetches it
// lazily when a guest actually opens a /join link.

export interface GuestEntryEvent {
  type: "entry";
  key: string;
  value: string;
  author: string;
}
export interface GuestDeleteEvent {
  type: "delete";
  key: string;
  author: string;
}
export interface GuestSyncFinishedEvent {
  type: "syncFinished";
}
export interface GuestGossipEvent {
  type: "gossip";
  payload: Record<string, unknown>;
  author: string;
}
export interface GuestPeerEvent {
  type: "peerUp" | "peerDown";
}
export type GuestEvent =
  | GuestEntryEvent
  | GuestDeleteEvent
  | GuestSyncFinishedEvent
  | GuestGossipEvent
  | GuestPeerEvent;

export interface PeekJoinSession {
  events(): ReadableStream<GuestEvent>;
  endpointId(): string;
  sendGossip(json: string): Promise<void>;
  requestExec(nodeId: string, queries: string[]): Promise<void>;
  docPut(key: string, value: string): Promise<void>;
  docDel(key: string): Promise<void>;
  free(): void;
}

interface PeekJoinModule {
  default: (moduleOrPath?: unknown) => Promise<unknown>;
  PeekJoinSession: { join(ticket: string): Promise<PeekJoinSession> };
}

const WASM_BASE = "/peek-join";
let modulePromise: Promise<PeekJoinModule> | null = null;

// The magic comments keep the bundler from trying to resolve/inline the wasm
// glue — the browser fetches it from /public at runtime. They must lead the
// import argument, hence their own lines here.
function importGlue(url: string): Promise<PeekJoinModule> {
  return import(
    /* webpackIgnore: true */
    /* turbopackIgnore: true */
    url
  ) as unknown as Promise<PeekJoinModule>;
}

function loadModule(): Promise<PeekJoinModule> {
  if (!modulePromise) {
    modulePromise = (async () => {
      const mod = await importGlue(`${WASM_BASE}/peek_join.js`);
      await mod.default(`${WASM_BASE}/peek_join_bg.wasm`);
      return mod;
    })();
  }
  return modulePromise;
}

/** Dial a Peek host from a DocTicket string and begin syncing. */
export async function joinSession(ticket: string): Promise<PeekJoinSession> {
  const mod = await loadModule();
  return mod.PeekJoinSession.join(ticket);
}
