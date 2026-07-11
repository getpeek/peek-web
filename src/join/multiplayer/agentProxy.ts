// Guest side of the agent proxy: a run is requested by putting an
// `agent-requests/<id>` doc entry the host picks up. Completed messages come
// back through normal node sync; partial tokens stream over gossip. The host
// deletes the request key when the run ends — that delete is the reliable
// completion signal, with a timeout fallback for hosts that predate the
// protocol and silently ignore the key.

import { atom, getDefaultStore } from "jotai";
import { atomFamily } from "jotai/utils";
import { nanoid } from "nanoid";
import { agentCancelKey, agentRequestKey, AGENT_REQUESTS_PREFIX } from "./diff";
import type { PeekJoinSession } from "../wasmClient";

export interface PendingAgentRun {
  requestId: string;
  startedAt: number;
}

// Keyed by agent-node id. The AgentNode uses this for its thinking state.
export const pendingAgentRunsAtom = atom<Record<string, PendingAgentRun>>({});

// Accumulated partial text per agent node, fed by `agent-stream` gossip. Each
// packet carries the full partial so a dropped packet self-heals on the next.
export const agentIncomingAtom = atomFamily((_nodeId: string) => atom<string>(""));

const AGENT_RUN_TIMEOUT_MS = 120_000;

function clearRun(nodeId: string, requestId?: string) {
  const store = getDefaultStore();
  const pending = store.get(pendingAgentRunsAtom);
  const run = pending[nodeId];
  if (!run || (requestId !== undefined && run.requestId !== requestId)) {
    return;
  }
  const { [nodeId]: _gone, ...rest } = pending;
  store.set(pendingAgentRunsAtom, rest);
  store.set(agentIncomingAtom(nodeId), "");
}

export async function requestAgentRun(
  session: PeekJoinSession,
  nodeId: string,
  question: string,
): Promise<void> {
  const store = getDefaultStore();
  const requestId = nanoid(8);
  store.set(pendingAgentRunsAtom, prev => ({
    ...prev,
    [nodeId]: { requestId, startedAt: Date.now() },
  }));
  window.setTimeout(() => clearRun(nodeId, requestId), AGENT_RUN_TIMEOUT_MS);
  await session.docPut(agentRequestKey(requestId), JSON.stringify({ nodeId, question }));
}

export async function cancelAgentRun(session: PeekJoinSession, nodeId: string): Promise<void> {
  const store = getDefaultStore();
  const run = store.get(pendingAgentRunsAtom)[nodeId];
  if (!run) {
    return;
  }
  clearRun(nodeId);
  await session.docPut(agentCancelKey(run.requestId), "{}");
}

/** Route `agent-stream` / `agent-stream-end` gossip payloads. */
export function handleAgentGossip(payload: Record<string, unknown>): void {
  const nodeId = typeof payload.nodeId === "string" ? payload.nodeId : null;
  if (!nodeId) {
    return;
  }
  const store = getDefaultStore();
  if (payload.type === "agent-stream" && typeof payload.text === "string") {
    store.set(agentIncomingAtom(nodeId), payload.text);
    return;
  }
  if (payload.type === "agent-stream-end") {
    store.set(agentIncomingAtom(nodeId), "");
  }
}

/** The host deleted an agent-request key — the run it named is over. */
export function handleAgentRequestDelete(key: string): void {
  const requestId = key.slice(AGENT_REQUESTS_PREFIX.length);
  const store = getDefaultStore();
  const pending = store.get(pendingAgentRunsAtom);
  for (const [nodeId, run] of Object.entries(pending)) {
    if (run.requestId === requestId) {
      clearRun(nodeId, requestId);
      return;
    }
  }
}
