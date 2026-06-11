import type { Edge } from "@xyflow/react";

import type { AgentFlowNode } from "./AgentNode/AgentNode";
import type { QueryFlowNode } from "./QueryNode/QueryNode";
import type { ResultFlowNode } from "./ResultNode/ResultNode";
import type { ChartFlowNode } from "./ChartNode/ChartNode";
import type { VariableFlowNode } from "./VariableNode/VariableNode";
import type { DrawFlowNode } from "./DrawNode/DrawNode";
import type { TextFlowNode } from "./TextNode/TextNode";
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
  | VariableFlowNode
  | DrawFlowNode
  | TextFlowNode;

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
  | "collabDrawing"
  | "collab-finished";

// Anna's multiplayer finale drives the canvas autonomously; the visitor's own
// node actions (run / follow-reference / chart) are locked only while it plays.
// Every other phase leaves the nodes fully interactive.
export const COLLAB_ANIMATION_PHASES: DemoPhase[] = [
  "collabJoining",
  "collabQuery",
  "collabRunning",
  "collabResult",
  "collabDrawing",
];

export const AGENT_ID = "agent";
export const QUERY_ID = "query";
export const RESULT_ID = "result";
export const SETTINGS_ID = "ref-user_settings";
export const ADS_ID = "ref-job_ads";
export const CHART_ID = "chart";
export const VARIABLE_ID = "variable";
export const COLLAB_QUERY_ID = "collab-query";
export const COLLAB_RESULT_ID = "collab-result";
export const COLLAB_ARROW_ID = "collab-arrow";
export const COLLAB_TEXT_ID = "collab-text";

export const QUERY_COLOR = "rgb(186, 140, 240)";
export const RESULT_COLOR = "rgb(120, 200, 150)";
export const REFERENCE_COLOR = "rgb(81, 128, 230)";
export const CHART_COLOR = "rgb(218, 230, 81)";
export const VARIABLE_COLOR = "rgb(180, 129, 147)";

const AGENT_POSITION = { x: 56, y: 110 };
const QUERY_POSITION = { x: 540, y: 96 };
const RESULT_POSITION = { x: 1020, y: -20 };
const USER_SETTINGS_POSITION = { x: 820, y: 560 };
const JOB_ADS_POSITION = { x: 1300, y: 560 };
const CHART_POSITION = { x: 1500, y: 90 };
const VARIABLE_POSITION = { x: 600, y: -150 };
// top-left of the query Anna drags out (the create-drag origin; the cursor
// glides here, the node spawns here and grows from this corner). Sits in the
// empty band below the follow-reference nodes (y ≈ 560–780) so the multiplayer
// cluster never overlaps them.
export const COLLAB_QUERY_POSITION = { x: 1180, y: 920 };
const COLLAB_RESULT_POSITION = { x: 1720, y: 900 };
// Anna's annotation sits in the empty band under the collab cluster: the arrow
// box's top-right corner reaches up toward the result's bottom edge, the note
// sits left of the arrow's tail
export const COLLAB_ARROW_POSITION = { x: 1600, y: 1080 };
const COLLAB_ARROW_SIZE = { width: 260, height: 220 };
export const COLLAB_TEXT_POSITION = { x: 1240, y: 1240 };
// off the right edge: Anna's cursor flies in from here
export const CURSOR_START = { x: 2320, y: 1060 };

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

// Anna's freehand arrow + note. Both spawn empty (strokes trace in under her
// cursor, the note types on) with explicit dimensions so fitView can frame the
// annotation area before anything is visible. Decoration: not draggable —
// dragging the arrow away from the result it points at would break the joke.
export function createCollabArrowNode(): DrawFlowNode {
  return {
    id: COLLAB_ARROW_ID,
    type: "draw",
    position: COLLAB_ARROW_POSITION,
    ...COLLAB_ARROW_SIZE,
    draggable: false,
    selectable: false,
    data: { strokes: [], strokeWidth: 3.5, color: "var(--pk-collab-anna)" },
  };
}

export function createCollabTextNode(): TextFlowNode {
  return {
    id: COLLAB_TEXT_ID,
    type: "text",
    position: COLLAB_TEXT_POSITION,
    width: 380,
    height: 60,
    draggable: false,
    selectable: false,
    data: { text: "" },
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
