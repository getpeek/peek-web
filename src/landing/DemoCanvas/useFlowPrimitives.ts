"use client";

import { useCallback, useRef, useState } from "react";
import { useEdgesState, useNodesState, useReactFlow, type Edge } from "@xyflow/react";

import type { AgentNodeData } from "./AgentNode/AgentNode";
import type { QueryNodeData } from "./QueryNode/QueryNode";
import type { ResultNodeData } from "./ResultNode/ResultNode";
import type { CursorState } from "./RemoteCursor/CollabOverlay";
import { CURSOR_START, type DemoNode } from "./flowGraph";
import type { ResultRow } from "./data";

export type Point = { x: number; y: number };

// The flow's low-level vocabulary: React Flow state, the timer pool, the
// node/edge patch helpers, and the cursor tween. The flow state machine
// (useDemoFlow) and the multiplayer finale (useCollabFinale) are composed from
// these primitives so neither has to re-derive how a node is mutated or a
// cursor glides.
export function useFlowPrimitives(initialNodes: DemoNode[]) {
  const { fitView, setCenter } = useReactFlow();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState<DemoNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  // Anna's cursor — a screen-space overlay positioned from these flow coords
  const [cursor, setCursor] = useState<CursorState | null>(null);
  // tween source of truth, kept off React state so each tick reads the latest
  const cursorPos = useRef<Point>(CURSOR_START);

  const schedule = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const patchAgent = useCallback(
    (patch: Partial<AgentNodeData>) =>
      setNodes(current =>
        current.map(node =>
          node.type === "agent" ? { ...node, data: { ...node.data, ...patch } } : node,
        ),
      ),
    [setNodes],
  );

  const patchQueryById = useCallback(
    (id: string, patch: Partial<QueryNodeData>) =>
      setNodes(current =>
        current.map(node =>
          node.id === id && node.type === "query"
            ? { ...node, data: { ...node.data, ...patch } }
            : node,
        ),
      ),
    [setNodes],
  );

  const patchResultNode = useCallback(
    (id: string, patch: Partial<ResultNodeData>) =>
      setNodes(current =>
        current.map(node =>
          node.id === id && node.type === "result"
            ? { ...node, data: { ...node.data, ...patch } }
            : node,
        ),
      ),
    [setNodes],
  );

  const deanimateEdge = useCallback(
    (id: string) =>
      setEdges(current =>
        current.map(edge => (edge.id === id ? { ...edge, animated: false } : edge)),
      ),
    [setEdges],
  );

  const pressCursor = useCallback(
    (pressed: boolean) => setCursor(current => (current ? { ...current, pressed } : current)),
    [],
  );

  // Eased JS tween of the cursor's flow position; the overlay's short CSS
  // transition smooths between steps. `onStep` receives eased progress (0..1)
  // so callers can drive synced effects (e.g. the node growing under the drag).
  const glideCursor = useCallback(
    (
      to: Point,
      duration: number,
      opts?: { onStep?: (progress: number) => void; onDone?: () => void },
    ) => {
      const from = { ...cursorPos.current };
      const steps = Math.max(1, Math.round(duration / 24));
      let step = 0;
      const tick = () => {
        step += 1;
        const raw = step / steps;
        const eased = raw < 0.5 ? 2 * raw * raw : 1 - (-2 * raw + 2) ** 2 / 2;
        const position = {
          x: from.x + (to.x - from.x) * eased,
          y: from.y + (to.y - from.y) * eased,
        };
        cursorPos.current = position;
        setCursor(current => (current ? { ...current, x: position.x, y: position.y } : current));
        opts?.onStep?.(eased);
        if (step < steps) {
          schedule(24, tick);
          return;
        }
        opts?.onDone?.();
      };
      tick();
    },
    [schedule],
  );

  const streamSqlInto = useCallback(
    (id: string, fullText: string, onDone: () => void) => {
      let cursorIndex = 0;
      const tick = () => {
        cursorIndex = Math.min(fullText.length, cursorIndex + 4);
        patchQueryById(id, { sql: fullText.slice(0, cursorIndex) });
        if (cursorIndex < fullText.length) {
          schedule(28, tick);
          return;
        }
        onDone();
      };
      tick();
    },
    [patchQueryById, schedule],
  );

  const streamRowsInto = useCallback(
    (id: string, rows: ResultRow[], onDone: () => void) => {
      let count = 0;
      const tick = () => {
        count += 1;
        patchResultNode(id, { rows: rows.slice(0, count) });
        if (count < rows.length) {
          schedule(55, tick);
          return;
        }
        onDone();
      };
      tick();
    },
    [patchResultNode, schedule],
  );

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    cursor,
    setCursor,
    cursorPos,
    fitView,
    setCenter,
    schedule,
    clearTimers,
    patchAgent,
    patchQueryById,
    patchResultNode,
    deanimateEdge,
    pressCursor,
    glideCursor,
    streamSqlInto,
    streamRowsInto,
  };
}
