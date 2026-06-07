import type { Edge } from "@xyflow/react";

import type { AgentFlowNode } from "./AgentNode/AgentNode";
import type { QueryFlowNode } from "./QueryNode/QueryNode";
import type { ResultFlowNode } from "./ResultNode/ResultNode";
import type { ChartFlowNode } from "./ChartNode/ChartNode";
import type { VariableFlowNode } from "./VariableNode/VariableNode";
import {
  AGENT_PROMPT,
  COLLAB_RESULT_COLUMNS,
  COLLAB_RESULT_META,
  COLLAB_RESULT_ROWS,
  COLLAB_RESULT_TITLE,
  JOB_ADS_COLUMNS,
  MULTIPLAYER_QUERY_META,
  MULTIPLAYER_QUERY_TITLE,
  QUERY_META,
  QUERY_TITLE,
  RESULT_COLUMNS,
  RESULT_META,
  RESULT_ROWS,
  RESULT_TITLE,
  USER_SETTINGS_COLUMNS,
  VARIABLE_NAME,
  VARIABLE_VALUE,
  jobAdsRows,
  userSettingsRows,
} from "./data";

export type DemoNode =
  | AgentFlowNode
  | QueryFlowNode
  | ResultFlowNode
  | ChartFlowNode
  | VariableFlowNode;

export type DemoPhase =
  | "idle"
  | "thinking"
  | "queryStreaming"
  | "queryReady"
  | "running"
  | "resultStreaming"
  | "resultReady"
  | "referenced"
  | "charted"
  | "collabJoining"
  | "collabQuery"
  | "collabRunning"
  | "collabResult"
  | "collabDone";

export const AGENT_ID = "agent";
export const QUERY_ID = "query";
export const RESULT_ID = "result";
export const SETTINGS_ID = "ref-user_settings";
export const ADS_ID = "ref-job_ads";
export const CHART_ID = "chart";
export const VARIABLE_ID = "variable";
export const COLLAB_QUERY_ID = "collab-query";
export const COLLAB_RESULT_ID = "collab-result";

export const QUERY_COLOR = "rgb(186, 140, 240)";
export const RESULT_COLOR = "rgb(120, 200, 150)";
export const REFERENCE_COLOR = "rgb(81, 128, 230)";
export const CHART_COLOR = "rgb(218, 230, 81)";
export const VARIABLE_COLOR = "rgb(180, 129, 147)";

const AGENT_POSITION = { x: 56, y: 110 };
const QUERY_POSITION = { x: 540, y: 96 };
const RESULT_POSITION = { x: 1020, y: 70 };
const USER_SETTINGS_POSITION = { x: 820, y: 560 };
const JOB_ADS_POSITION = { x: 1300, y: 560 };
const CHART_POSITION = { x: 1500, y: 90 };
const VARIABLE_POSITION = { x: 600, y: -150 };
// top-left of the query Anna drags out (the create-drag origin; the cursor
// glides here, the node spawns here and grows from this corner)
export const COLLAB_QUERY_POSITION = { x: 1180, y: 620 };
const COLLAB_RESULT_POSITION = { x: 1720, y: 600 };
// off the right edge: Anna's cursor flies in from here
export const CURSOR_START = { x: 2320, y: 760 };

export function floatingEdge(id: string, source: string, target: string, color: string): Edge {
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

export function createAgentNode(onSend: () => void): AgentFlowNode {
  return {
    id: AGENT_ID,
    type: "agent",
    position: AGENT_POSITION,
    data: { draft: AGENT_PROMPT, messages: [], thinking: false, sent: false, onSend },
  };
}

export function createQueryNode(onRun: () => void): QueryFlowNode {
  return {
    id: QUERY_ID,
    type: "query",
    position: QUERY_POSITION,
    data: { title: QUERY_TITLE, meta: QUERY_META, sql: "", status: "streaming", onRun },
  };
}

export function createCollabQueryNode(onRun: () => void): QueryFlowNode {
  return {
    id: COLLAB_QUERY_ID,
    type: "query",
    position: COLLAB_QUERY_POSITION,
    data: {
      title: MULTIPLAYER_QUERY_TITLE,
      meta: MULTIPLAYER_QUERY_META,
      sql: "",
      status: "streaming",
      onRun,
      // spawns tiny; the create-drag grows it to 1
      createScale: 0.18,
    },
  };
}

export function createVariableNode(): VariableFlowNode {
  return {
    id: VARIABLE_ID,
    type: "variable",
    position: VARIABLE_POSITION,
    data: { name: VARIABLE_NAME, value: VARIABLE_VALUE },
  };
}

export function createResultNode(
  onReference: (userId: string) => void,
  onChart: () => void,
): ResultFlowNode {
  return {
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
}

export function createSettingsNode(userId: string): ResultFlowNode {
  return {
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
}

export function createAdsNode(userId: string): ResultFlowNode {
  return {
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
}

export function createChartNode(
  title: string,
  valueColumn: string,
  values: number[],
): ChartFlowNode {
  return {
    id: CHART_ID,
    type: "chart",
    position: CHART_POSITION,
    data: { title, valueColumn, values },
  };
}

// Anna's query result — lists who's in the session. No follow-reference / chart
// affordances (it's the demo's closing beat, not another branch point).
export function createCollabResultNode(): ResultFlowNode {
  return {
    id: COLLAB_RESULT_ID,
    type: "result",
    position: COLLAB_RESULT_POSITION,
    data: {
      title: COLLAB_RESULT_TITLE,
      meta: COLLAB_RESULT_META,
      total: COLLAB_RESULT_ROWS.length,
      columns: COLLAB_RESULT_COLUMNS,
      rows: [],
      width: 340,
    },
  };
}

