"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AGENT_ID,
  COLLAB_ANIMATION_PHASES,
  CURSOR_START,
  QUERY_COLOR,
  QUERY_ID,
  RESULT_COLOR,
  RESULT_ID,
  VARIABLE_COLOR,
  VARIABLE_ID,
  createAgentNode,
  createQueryNode,
  createResultNode,
  createVariableNode,
  floatingEdge,
  type DemoPhase,
} from "./flowGraph";
import { AGENT_PROMPT, AGENT_REPLY, RESULT_ROWS, SQL_TEXT } from "./data";
import { useFlowPrimitives } from "./useFlowPrimitives";
import { useCollabFinale } from "./useCollabFinale";
import { useBranchActions } from "./useBranchActions";

// Streaming nodes grow downward after they spawn, so they're framed once they
// reach full height (see streamSql/streamRows) — symmetric padding then centers
// the created node, which keeps its footer clear of the bottom toolbar.
const CREATED_NODE_PADDING = 0.32;

export function useDemoFlow() {
  const phase = useRef<DemoPhase>("idle");

  // The nodes carry their action handlers in `data`, but those handlers are
  // defined after the node state. Stable wrappers pointing at the latest
  // handler keep node-data identity steady while breaking the cycle.
  const sendRef = useRef<() => void>(() => {});
  const runRef = useRef<() => void>(() => {});
  const referenceRef = useRef<(userId: string) => void>(() => {});
  const chartRef = useRef<() => void>(() => {});
  const onSend = useCallback(() => sendRef.current(), []);
  const onRun = useCallback(() => runRef.current(), []);
  const onReference = useCallback((userId: string) => referenceRef.current(userId), []);
  const onChart = useCallback(() => chartRef.current(), []);

  // surfaced to the title bar so Anna's avatar pops in when she joins
  const [collabJoined, setCollabJoined] = useState(false);

  const {
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
    deanimateEdge,
    pressCursor,
    glideCursor,
    streamSqlInto,
    streamRowsInto,
  } = useFlowPrimitives([createAgentNode(onSend)]);

  const startCollab = useCollabFinale({
    phase,
    setNodes,
    setEdges,
    setCursor,
    cursorPos,
    setCollabJoined,
    fitView,
    setCenter,
    schedule,
    glideCursor,
    pressCursor,
    patchAgent,
    patchQueryById,
    streamSqlInto,
    streamRowsInto,
    deanimateEdge,
  });

  const { reference, chart } = useBranchActions({ phase, setNodes, setEdges, schedule, fitView });
  referenceRef.current = reference;
  chartRef.current = chart;

  const streamSql = useCallback(() => {
    streamSqlInto(QUERY_ID, SQL_TEXT, () => {
      patchQueryById(QUERY_ID, { status: "ready" });
      deanimateEdge("agent-query");
      phase.current = "queryReady";
      // the node grew taller as the SQL streamed in (and only now shows its Run
      // button); the streaming-time fit framed the empty node, so reframe the
      // full-height node to lift its footer clear of the bottom toolbar
      schedule(80, () =>
        fitView({
          nodes: [{ id: QUERY_ID }, { id: VARIABLE_ID }],
          duration: 600,
          padding: CREATED_NODE_PADDING,
          maxZoom: 1,
        }),
      );
    });
  }, [streamSqlInto, patchQueryById, deanimateEdge, schedule, fitView]);

  const streamRows = useCallback(() => {
    streamRowsInto(RESULT_ID, RESULT_ROWS, () => {
      deanimateEdge("query-result");
      phase.current = "resultReady";
      // rows streamed in and grew the node past the streaming-time frame;
      // reframe the full-height result so it sits centered, clear of the toolbar
      schedule(80, () =>
        fitView({
          nodes: [{ id: RESULT_ID }],
          duration: 600,
          padding: CREATED_NODE_PADDING,
          maxZoom: 1,
        }),
      );
    });
  }, [streamRowsInto, deanimateEdge, schedule, fitView]);

  const send = useCallback(() => {
    if (phase.current !== "idle" && phase.current !== "collab-finished") {
      return;
    }
    // re-asking restarts the pipeline: clear Anna and everything the prior run built
    setCollabJoined(false);
    setCursor(null);
    cursorPos.current = { ...CURSOR_START };
    phase.current = "thinking";

    patchAgent({
      sent: true,
      thinking: true,
      draft: "",
      messages: [{ id: "u1", role: "user", text: AGENT_PROMPT }],
    });

    // simulate the model thinking before it answers + spawns the query
    schedule(1100, () => {
      patchAgent({
        thinking: false,
        messages: [
          { id: "u1", role: "user", text: AGENT_PROMPT },
          { id: "a1", role: "assistant", text: AGENT_REPLY },
        ],
      });

      // keep only the agent, then re-grow the query + variable beneath it
      setNodes(current => [
        ...current.filter(node => node.id === AGENT_ID),
        createQueryNode(onRun),
        createVariableNode(),
      ]);
      setEdges([
        { ...floatingEdge("agent-query", AGENT_ID, QUERY_ID, QUERY_COLOR), animated: true },
        floatingEdge("variable-query", VARIABLE_ID, QUERY_ID, VARIABLE_COLOR),
      ]);
      phase.current = "queryStreaming";

      // let the new nodes mount + measure, then frame the query + its variable
      schedule(140, () =>
        fitView({
          nodes: [{ id: QUERY_ID }, { id: VARIABLE_ID }],
          duration: 800,
          padding: CREATED_NODE_PADDING,
          maxZoom: 1,
        }),
      );
      schedule(360, streamSql);
    });
  }, [
    patchAgent,
    schedule,
    setNodes,
    setEdges,
    fitView,
    streamSql,
    onRun,
    setCollabJoined,
    setCursor,
    cursorPos,
  ]);

  sendRef.current = send;

  const run = useCallback(() => {
    if (COLLAB_ANIMATION_PHASES.includes(phase.current)) {
      return;
    }
    phase.current = "running";
    patchQueryById(QUERY_ID, { status: "running" });

    // simulate execution latency, then materialise the result
    schedule(700, () => {
      patchQueryById(QUERY_ID, { status: "done" });

      // re-running replaces the prior result rather than stacking a duplicate id
      setNodes(current => [
        ...current.filter(node => node.id !== RESULT_ID),
        createResultNode(onReference, onChart),
      ]);
      setEdges(current => [
        ...current.filter(edge => edge.id !== "query-result"),
        { ...floatingEdge("query-result", QUERY_ID, RESULT_ID, RESULT_COLOR), animated: true },
      ]);
      phase.current = "resultStreaming";

      schedule(140, () =>
        fitView({
          nodes: [{ id: RESULT_ID }],
          duration: 800,
          padding: CREATED_NODE_PADDING,
          maxZoom: 1,
        }),
      );
      schedule(360, streamRows);
    });
  }, [patchQueryById, schedule, setNodes, setEdges, fitView, streamRows, onReference, onChart]);

  runRef.current = run;

  const reset = useCallback(() => {
    clearTimers();
    phase.current = "idle";
    setCollabJoined(false);
    setCursor(null);
    cursorPos.current = { ...CURSOR_START };
    setEdges([]);
    setNodes([createAgentNode(onSend)]);
    schedule(60, () =>
      fitView({
        nodes: [{ id: AGENT_ID }],
        duration: 600,
        padding: 0.4,
        maxZoom: 1,
      }),
    );
  }, [
    clearTimers,
    setEdges,
    setNodes,
    onSend,
    schedule,
    fitView,
    setCollabJoined,
    setCursor,
    cursorPos,
  ]);

  useEffect(() => clearTimers, [clearTimers]);

  return { nodes, edges, onNodesChange, onEdgesChange, reset, startCollab, collabJoined, cursor };
}
