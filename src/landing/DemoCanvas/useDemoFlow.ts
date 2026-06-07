"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEdgesState, useNodesState, useReactFlow, type Edge } from "@xyflow/react";

import type { AgentNodeData } from "./AgentNode/AgentNode";
import type { QueryNodeData } from "./QueryNode/QueryNode";
import type { ResultNodeData } from "./ResultNode/ResultNode";
import {
  ADS_ID,
  AGENT_ID,
  CHART_COLOR,
  CHART_ID,
  QUERY_COLOR,
  QUERY_ID,
  REFERENCE_COLOR,
  RESULT_COLOR,
  RESULT_ID,
  SETTINGS_ID,
  VARIABLE_COLOR,
  VARIABLE_ID,
  createAdsNode,
  createAgentNode,
  createChartNode,
  createQueryNode,
  createResultNode,
  createSettingsNode,
  createVariableNode,
  floatingEdge,
  type DemoNode,
  type DemoPhase,
} from "./flowGraph";
import { AGENT_PROMPT, AGENT_REPLY, RESULT_COLUMNS, RESULT_ROWS, SQL_TEXT } from "./data";

export function useDemoFlow() {
  const { fitView } = useReactFlow();
  const phase = useRef<DemoPhase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  const [nodes, setNodes, onNodesChange] = useNodesState<DemoNode>([createAgentNode(onSend)]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

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

  const patchQuery = useCallback(
    (patch: Partial<QueryNodeData>) =>
      setNodes(current =>
        current.map(node =>
          node.type === "query" ? { ...node, data: { ...node.data, ...patch } } : node,
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

  const streamSql = useCallback(() => {
    let cursor = 0;
    const tick = () => {
      cursor = Math.min(SQL_TEXT.length, cursor + 4);
      patchQuery({ sql: SQL_TEXT.slice(0, cursor) });
      if (cursor < SQL_TEXT.length) {
        schedule(28, tick);
        return;
      }
      patchQuery({ status: "ready" });
      deanimateEdge("agent-query");
      phase.current = "queryReady";
    };
    tick();
  }, [patchQuery, schedule, deanimateEdge]);

  const streamRows = useCallback(() => {
    let count = 0;
    const tick = () => {
      count += 1;
      patchResultNode(RESULT_ID, { rows: RESULT_ROWS.slice(0, count) });
      if (count < RESULT_ROWS.length) {
        schedule(55, tick);
        return;
      }
      deanimateEdge("query-result");
      phase.current = "resultReady";
    };
    tick();
  }, [patchResultNode, schedule, deanimateEdge]);

  const send = useCallback(() => {
    if (phase.current !== "idle") {
      return;
    }
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

      setNodes(current => [...current, createQueryNode(onRun), createVariableNode()]);
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
          padding: 0.32,
          maxZoom: 1,
        }),
      );
      schedule(360, streamSql);
    });
  }, [patchAgent, schedule, setNodes, setEdges, fitView, streamSql, onRun]);

  sendRef.current = send;

  const run = useCallback(() => {
    if (phase.current !== "queryReady") {
      return;
    }
    phase.current = "running";
    patchQuery({ status: "running" });

    // simulate execution latency, then materialise the result
    schedule(700, () => {
      patchQuery({ status: "done" });

      setNodes(current => [...current, createResultNode(onReference, onChart)]);
      setEdges(current => [
        ...current,
        { ...floatingEdge("query-result", QUERY_ID, RESULT_ID, RESULT_COLOR), animated: true },
      ]);
      phase.current = "resultStreaming";

      schedule(140, () =>
        fitView({
          nodes: [{ id: RESULT_ID }],
          duration: 800,
          padding: 0.3,
          maxZoom: 1,
        }),
      );
      schedule(360, streamRows);
    });
  }, [patchQuery, schedule, setNodes, setEdges, fitView, streamRows, onReference, onChart]);

  runRef.current = run;

  // Click a user_id in the result → surface the rows that reference it. Clicking
  // a different id moves the reference subtree to that user.
  const reference = useCallback(
    (userId: string) => {
      if (phase.current !== "resultReady" && phase.current !== "referenced") {
        return;
      }
      phase.current = "referenced";

      setNodes(current => [
        ...current.filter(node => node.id !== SETTINGS_ID && node.id !== ADS_ID),
        createSettingsNode(userId),
        createAdsNode(userId),
      ]);
      setEdges(current => [
        ...current.filter(edge => edge.id !== "result-settings" && edge.id !== "result-ads"),
        floatingEdge("result-settings", RESULT_ID, SETTINGS_ID, REFERENCE_COLOR),
        floatingEdge("result-ads", RESULT_ID, ADS_ID, REFERENCE_COLOR),
      ]);

      schedule(140, () =>
        fitView({
          nodes: [{ id: RESULT_ID }, { id: SETTINGS_ID }, { id: ADS_ID }],
          duration: 800,
          padding: 0.22,
          maxZoom: 1,
        }),
      );
    },
    [setNodes, setEdges, schedule, fitView],
  );

  referenceRef.current = reference;

  // Visualize the result's numeric column as a bar chart node.
  const chart = useCallback(() => {
    if (phase.current !== "resultReady" && phase.current !== "referenced") {
      return;
    }
    const valueColumn = RESULT_COLUMNS.find(column => column.kind === "num");
    if (!valueColumn) {
      return;
    }
    const labelColumn = RESULT_COLUMNS[0];
    const values = RESULT_ROWS.map(row => Number(row[valueColumn.key]));

    setNodes(current => [
      ...current.filter(node => node.id !== CHART_ID),
      createChartNode(`${valueColumn.key} by ${labelColumn.key}`, valueColumn.key, values),
    ]);
    setEdges(current => [
      ...current.filter(edge => edge.id !== "result-chart"),
      floatingEdge("result-chart", RESULT_ID, CHART_ID, CHART_COLOR),
    ]);
    schedule(140, () =>
      fitView({
        nodes: [{ id: RESULT_ID }, { id: CHART_ID }],
        duration: 800,
        padding: 0.3,
        maxZoom: 1,
      }),
    );
  }, [setNodes, setEdges, schedule, fitView]);

  chartRef.current = chart;

  const reset = useCallback(() => {
    clearTimers();
    phase.current = "idle";
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
  }, [clearTimers, setEdges, setNodes, onSend, schedule, fitView]);

  useEffect(() => clearTimers, [clearTimers]);

  return { nodes, edges, onNodesChange, onEdgesChange, reset };
}
