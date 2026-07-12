// Guest side of the LSP proxy: the browser has no language server, so
// completion/diagnostic requests round-trip to the desktop host as doc
// entries. Keys are stable per editor model and kind — iroh-docs deletes are
// author-scoped (a guest can never physically remove a host-authored entry),
// so instead of unique keys + deletes, each side overwrites its own key and
// LWW prunes the superseded version. Correlation is the requestId echoed in
// the payload; replayed-on-join, foreign, and late responses all miss the
// pending map and are ignored.

import { nanoid } from "nanoid";
import { lspRequestKey, lspResponseKey, type LspRequestKind } from "./diff";
import type { PeekJoinSession } from "../wasmClient";
import type { LspCompletionItem, LspDiagnostic } from "../canvas/nodes/Query/Editor/lspTypes";

const LSP_TIMEOUT_MS = 5000;

interface PendingLspRequest {
  requestId: string;
  timer: number;
  resolve: (payload: Record<string, unknown> | null) => void;
}

// Keyed by response doc key — one in-flight request per editor model per kind.
// A newer request supersedes the old one; Monaco's cancellation token has
// already given up on the superseded promise.
const pending = new Map<string, PendingLspRequest>();

function settle(responseKey: string, payload: Record<string, unknown> | null): void {
  const entry = pending.get(responseKey);
  if (!entry) {
    return;
  }
  pending.delete(responseKey);
  window.clearTimeout(entry.timer);
  entry.resolve(payload);
}

function request(
  session: PeekJoinSession,
  kind: LspRequestKind,
  modelId: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const nonce = session.endpointId().slice(0, 8);
  const requestId = nanoid(8);
  const responseKey = lspResponseKey(nonce, kind, modelId);
  settle(responseKey, null);
  return new Promise(resolve => {
    const timer = window.setTimeout(() => settle(responseKey, null), LSP_TIMEOUT_MS);
    pending.set(responseKey, { requestId, timer, resolve });
    // The uri namespaces this guest's documents inside the host's LSP backend;
    // nesting the full inmemory:// model uri would risk a Uri parse rejection
    // on the Rust side, so rebuild it under our own scheme.
    const uri = `web-guest://${nonce}/model/${modelId}`;
    session
      .docPut(lspRequestKey(nonce, kind, modelId), JSON.stringify({ requestId, uri, ...body }))
      .catch(() => settle(responseKey, null));
  });
}

export async function requestCompletion(
  session: PeekJoinSession,
  args: { modelId: string; text: string; line: number; character: number },
): Promise<LspCompletionItem[]> {
  const payload = await request(session, "completion", args.modelId, {
    text: args.text,
    line: args.line,
    character: args.character,
  });
  return Array.isArray(payload?.items) ? (payload.items as LspCompletionItem[]) : [];
}

/** Resolves `null` on timeout/supersede — keep the existing markers in that case. */
export async function requestDiagnostics(
  session: PeekJoinSession,
  args: { modelId: string; text: string },
): Promise<LspDiagnostic[] | null> {
  const payload = await request(session, "diagnostics", args.modelId, { text: args.text });
  if (!payload) {
    return null;
  }
  return Array.isArray(payload.diagnostics) ? (payload.diagnostics as LspDiagnostic[]) : [];
}

/** Route an inbound `lsp-responses/…` doc entry to the request awaiting it. */
export function handleLspResponse(key: string, value: string): void {
  const entry = pending.get(key);
  if (!entry) {
    return;
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(value) as Record<string, unknown>;
  } catch {
    return;
  }
  if (payload.requestId !== entry.requestId) {
    return;
  }
  settle(key, payload);
}
