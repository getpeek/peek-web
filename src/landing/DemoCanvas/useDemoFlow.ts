"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
} from "@xyflow/react";

import type { AgentFlowNode, AgentNodeData } from "./AgentNode/AgentNode";
import type { QueryFlowNode, QueryNodeData } from "./QueryNode/QueryNode";
import type { ResultFlowNode, ResultNodeData } from "./ResultNode/ResultNode";
import type { ChartFlowNode } from "./ChartNode/ChartNode";
import type { VariableFlowNode } from "./VariableNode/VariableNode";
import {
  AGENT_PROMPT,
  AGENT_REPLY,
  JOB_ADS_COLUMNS,
  RESULT_COLUMNS,
  RESULT_META,
  RESULT_ROWS,
  RESULT_TITLE,
  SQL_TEXT,
  USER_SETTINGS_COLUMNS,
  VARIABLE_NAME,
  VARIABLE_VALUE,
  jobAdsRows,
  userSettingsRows,
} from "./data";

type DemoNode =
  | AgentFlowNode
  | QueryFlowNode
  | ResultFlowNode
  | ChartFlowNode
  | VariableFlowNode;
type DemoPhase =
  | "idle"
  | "thinking"
  | "queryStreaming"
  | "queryReady"
  | "running"
  | "resultStreaming"
  | "resultReady"
  | "referenced";

const AGENT_ID = "agent";
const QUERY_ID = "query";
const RESULT_ID = "result";
const SETTINGS_ID = "ref-user_settings";
const ADS_ID = "ref-job_ads";
const CHART_ID = "chart";
const VARIABLE_ID = "variable";

const QUERY_COLOR = "rgb(186, 140, 240)";
const RESULT_COLOR = "rgb(120, 200, 150)";
const REFERENCE_COLOR = "rgb(81, 128, 230)";
const CHART_COLOR = "rgb(218, 230, 81)";
const VARIABLE_COLOR = "rgb(180, 129, 147)";

const AGENT_POSITION = { x: 56, y: 110 };
const QUERY_POSITION = { x: 540, y: 96 };
const RESULT_POSITION = { x: 1020, y: 70 };
const USER_SETTINGS_POSITION = { x: 820, y: 560 };
const JOB_ADS_POSITION = { x: 1300, y: 560 };
const CHART_POSITION = { x: 1500, y: 90 };
const VARIABLE_POSITION = { x: 600, y: -150 };

function createAgentNode(onSend: () => void): AgentFlowNode {
  return {
    id: AGENT_ID,
    type: "agent",
    position: AGENT_POSITION,
    data: { draft: AGENT_PROMPT, messages: [], thinking: false, sent: false, onSend },
  };
}

function floatingEdge(id: string, source: string, target: string, color: string): Edge {
  return {
    id,
    source,
    target,
    type: "floating",
    style: {
      stroke: color,
      strokeWidth: 1.6,
      filter: `drop-shadow(0 0 6px ${color})`,
    },
  };
}

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

  const [nodes, setNodes, onNodesChange] = useNodesState<DemoNode>([
    createAgentNode(onSend),
  ]);
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
      setNodes((current) =>
        current.map((node) =>
          node.type === "agent"
            ? { ...node, data: { ...node.data, ...patch } }
            : node,
        ),
      ),
    [setNodes],
  );

  const patchQuery = useCallback(
    (patch: Partial<QueryNodeData>) =>
      setNodes((current) =>
        current.map((node) =>
          node.type === "query"
            ? { ...node, data: { ...node.data, ...patch } }
            : node,
        ),
      ),
    [setNodes],
  );

  const patchResultNode = useCallback(
    (id: string, patch: Partial<ResultNodeData>) =>
      setNodes((current) =>
        current.map((node) =>
          node.id === id && node.type === "result"
            ? { ...node, data: { ...node.data, ...patch } }
            : node,
        ),
      ),
    [setNodes],
  );

  const deanimateEdge = useCallback(
    (id: string) =>
      setEdges((current) =>
        current.map((edge) =>
          edge.id === id ? { ...edge, animated: false } : edge,
        ),
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
    if (phase.current !== "idle") return;
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

      const queryNode: QueryFlowNode = {
        id: QUERY_ID,
        type: "query",
        position: QUERY_POSITION,
        data: { sql: "", status: "streaming", onRun },
      };
      const variableNode: VariableFlowNode = {
        id: VARIABLE_ID,
        type: "variable",
        position: VARIABLE_POSITION,
        data: { name: VARIABLE_NAME, value: VARIABLE_VALUE },
      };
      setNodes((current) => [...current, queryNode, variableNode]);
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
    if (phase.current !== "queryReady") return;
    phase.current = "running";
    patchQuery({ status: "running" });

    // simulate execution latency, then materialise the result
    schedule(700, () => {
      patchQuery({ status: "done" });

      const resultNode: ResultFlowNode = {
        id: RESULT_ID,
        type: "result",
        position: RESULT_POSITION,
        data: {
          title: RESULT_TITLE,
          meta: RESULT_META,
          total: RESULT_ROWS.length,
          columns: RESULT_COLUMNS,
          rows: [],
          width: 380,
          referenceColumn: "user_id",
          onReference,
          onChart,
        },
      };
      setNodes((current) => [...current, resultNode]);
      setEdges((current) => [
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
      if (phase.current !== "resultReady" && phase.current !== "referenced") return;
      phase.current = "referenced";

      const settingsNode: ResultFlowNode = {
        id: SETTINGS_ID,
        type: "result",
        position: USER_SETTINGS_POSITION,
        data: {
          title: "user_settings",
          meta: "2 ms",
          total: 1,
          columns: USER_SETTINGS_COLUMNS,
          rows: userSettingsRows(userId),
          width: 360,
        },
      };
      const adsNode: ResultFlowNode = {
        id: ADS_ID,
        type: "result",
        position: JOB_ADS_POSITION,
        data: {
          title: "job_ads",
          meta: "3 ms",
          total: 3,
          columns: JOB_ADS_COLUMNS,
          rows: jobAdsRows(userId),
          width: 440,
        },
      };

      setNodes((current) => [
        ...current.filter((node) => node.id !== SETTINGS_ID && node.id !== ADS_ID),
        settingsNode,
        adsNode,
      ]);
      setEdges((current) => [
        ...current.filter(
          (edge) => edge.id !== "result-settings" && edge.id !== "result-ads",
        ),
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
    if (phase.current !== "resultReady" && phase.current !== "referenced") return;
    const valueColumn = RESULT_COLUMNS.find((column) => column.kind === "num");
    if (!valueColumn) return;
    const labelColumn = RESULT_COLUMNS[0];
    const values = RESULT_ROWS.map((row) => Number(row[valueColumn.key]));

    const chartNode: ChartFlowNode = {
      id: CHART_ID,
      type: "chart",
      position: CHART_POSITION,
      data: {
        title: `${valueColumn.key} by ${labelColumn.key}`,
        valueColumn: valueColumn.key,
        values,
      },
    };
    setNodes((current) => [
      ...current.filter((node) => node.id !== CHART_ID),
      chartNode,
    ]);
    setEdges((current) => [
      ...current.filter((edge) => edge.id !== "result-chart"),
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
