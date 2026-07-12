// Port of the desktop `src/multiplayer/diff.ts` with string values instead of
// Uint8Array (the wasm client speaks UTF-8 strings end-to-end), plus the
// agent-proxy key prefixes. Key scheme must stay byte-compatible with the
// desktop app — drift means silent sync failure.

import type { AppEdge, AppNode, CanvasDocument, PageState, RegionState } from "../canvas/types";
import { stripEdge, stripNode } from "../canvas/stripEphemeral";
import type { Operation } from "./types";

const PAGE_ORDER_KEY = "doc/page-order";
export const RESULTS_PREFIX = "results/";
export const EXEC_REQUESTS_PREFIX = "exec-requests/";
export const AGENT_REQUESTS_PREFIX = "agent-requests/";
export const AGENT_CANCELS_PREFIX = "agent-cancels/";
export const LSP_REQUESTS_PREFIX = "lsp-requests/";
export const LSP_RESPONSES_PREFIX = "lsp-responses/";
export const SCHEMA_INDEX_KEY = "schema/index";

export type LspRequestKind = "completion" | "diagnostics";

function nodeKey(pageId: string, nodeId: string): string {
  return `pages/${pageId}/nodes/${nodeId}`;
}

function edgeKey(pageId: string, edgeId: string): string {
  return `pages/${pageId}/edges/${edgeId}`;
}

function pageNameKey(pageId: string): string {
  return `pages/${pageId}/name`;
}

function regionKey(pageId: string, regionId: string): string {
  return `pages/${pageId}/regions/${regionId}`;
}

export function resultKey(nodeId: string): string {
  return `${RESULTS_PREFIX}${nodeId}`;
}

export function agentRequestKey(requestId: string): string {
  return `${AGENT_REQUESTS_PREFIX}${requestId}`;
}

export function agentCancelKey(requestId: string): string {
  return `${AGENT_CANCELS_PREFIX}${requestId}`;
}

export function lspRequestKey(nonce: string, kind: LspRequestKind, modelId: string): string {
  return `${LSP_REQUESTS_PREFIX}${nonce}/${kind}/${modelId}`;
}

export function lspResponseKey(nonce: string, kind: LspRequestKind, modelId: string): string {
  return `${LSP_RESPONSES_PREFIX}${nonce}/${kind}/${modelId}`;
}

export type KeyKind =
  | "doc"
  | "result"
  | "exec-request"
  | "agent-request"
  | "agent-cancel"
  | "lsp-request"
  | "lsp-response"
  | "schema"
  | "unknown";

export function keyKind(key: string): KeyKind {
  if (key === PAGE_ORDER_KEY) {
    return "doc";
  }
  if (key.startsWith("pages/")) {
    return "doc";
  }
  if (key.startsWith(RESULTS_PREFIX)) {
    return "result";
  }
  if (key.startsWith(EXEC_REQUESTS_PREFIX)) {
    return "exec-request";
  }
  if (key.startsWith(AGENT_REQUESTS_PREFIX)) {
    return "agent-request";
  }
  if (key.startsWith(AGENT_CANCELS_PREFIX)) {
    return "agent-cancel";
  }
  if (key.startsWith(LSP_REQUESTS_PREFIX)) {
    return "lsp-request";
  }
  if (key.startsWith(LSP_RESPONSES_PREFIX)) {
    return "lsp-response";
  }
  if (key === SCHEMA_INDEX_KEY) {
    return "schema";
  }
  return "unknown";
}

/**
 * Compute the per-key operations needed to converge `prev` to `next`. Skips
 * viewport (per-user) and ephemeral node/edge fields (selected/dragging/resizing).
 *
 * v0 uses whole-node keys for all node types. A future refinement will split
 * query nodes into position/data subkeys to avoid LWW collisions on concurrent
 * drag + SQL-edit.
 */
export function diffDocs(prev: CanvasDocument, next: CanvasDocument): Operation[] {
  const ops: Operation[] = [];

  // activePageId is intentionally not synced — it's per-peer UI state. Each
  // participant chooses their own active page.

  const prevOrderJson = JSON.stringify(prev.pageOrder);
  const nextOrderJson = JSON.stringify(next.pageOrder);
  if (prevOrderJson !== nextOrderJson) {
    ops.push({
      kind: "put",
      key: PAGE_ORDER_KEY,
      value: nextOrderJson,
    });
  }

  for (const pageId of Object.keys(prev.pages)) {
    if (next.pages[pageId]) {
      continue;
    }
    const prevPage = prev.pages[pageId];
    for (const node of prevPage.nodes) {
      ops.push({ kind: "del", key: nodeKey(pageId, node.id) });
    }
    for (const edge of prevPage.edges) {
      ops.push({ kind: "del", key: edgeKey(pageId, edge.id) });
    }
    for (const region of prevPage.regions ?? []) {
      ops.push({ kind: "del", key: regionKey(pageId, region.id) });
    }
    ops.push({ kind: "del", key: pageNameKey(pageId) });
  }

  for (const [pageId, nextPage] of Object.entries(next.pages)) {
    const prevPage = prev.pages[pageId];

    if (!prevPage || prevPage.name !== nextPage.name) {
      ops.push({
        kind: "put",
        key: pageNameKey(pageId),
        value: nextPage.name,
      });
    }

    diffNodes(pageId, prevPage, nextPage, ops);
    diffEdges(pageId, prevPage, nextPage, ops);
    diffRegions(pageId, prevPage, nextPage, ops);
  }

  return ops;
}

function diffNodes(
  pageId: string,
  prevPage: PageState | undefined,
  nextPage: PageState,
  ops: Operation[],
): void {
  const prevById = new Map<string, AppNode>((prevPage?.nodes ?? []).map(n => [n.id, n]));
  const nextById = new Map<string, AppNode>(nextPage.nodes.map(n => [n.id, n]));

  for (const [nodeId] of prevById) {
    if (!nextById.has(nodeId)) {
      ops.push({ kind: "del", key: nodeKey(pageId, nodeId) });
    }
  }

  for (const [nodeId, nextNode] of nextById) {
    const prevNode = prevById.get(nodeId);
    const stripped = stripNode(nextNode);
    if (!prevNode || JSON.stringify(stripNode(prevNode)) !== JSON.stringify(stripped)) {
      ops.push({
        kind: "put",
        key: nodeKey(pageId, nodeId),
        value: JSON.stringify(stripped),
      });
    }
  }
}

function diffEdges(
  pageId: string,
  prevPage: PageState | undefined,
  nextPage: PageState,
  ops: Operation[],
): void {
  const prevById = new Map<string, AppEdge>((prevPage?.edges ?? []).map(e => [e.id, e]));
  const nextById = new Map<string, AppEdge>(nextPage.edges.map(e => [e.id, e]));

  for (const [edgeId] of prevById) {
    if (!nextById.has(edgeId)) {
      ops.push({ kind: "del", key: edgeKey(pageId, edgeId) });
    }
  }

  for (const [edgeId, nextEdge] of nextById) {
    const prevEdge = prevById.get(edgeId);
    const stripped = stripEdge(nextEdge);
    if (!prevEdge || JSON.stringify(stripEdge(prevEdge)) !== JSON.stringify(stripped)) {
      ops.push({
        kind: "put",
        key: edgeKey(pageId, edgeId),
        value: JSON.stringify(stripped),
      });
    }
  }
}

function diffRegions(
  pageId: string,
  prevPage: PageState | undefined,
  nextPage: PageState,
  ops: Operation[],
): void {
  const prevById = new Map<string, RegionState>((prevPage?.regions ?? []).map(r => [r.id, r]));
  const nextById = new Map<string, RegionState>((nextPage.regions ?? []).map(r => [r.id, r]));

  for (const [regionId] of prevById) {
    if (!nextById.has(regionId)) {
      ops.push({ kind: "del", key: regionKey(pageId, regionId) });
    }
  }

  for (const [regionId, nextRegion] of nextById) {
    const prevRegion = prevById.get(regionId);
    if (!prevRegion || JSON.stringify(prevRegion) !== JSON.stringify(nextRegion)) {
      ops.push({
        kind: "put",
        key: regionKey(pageId, regionId),
        value: JSON.stringify(nextRegion),
      });
    }
  }
}
