"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEdgesState, useNodesState, useReactFlow, type Edge } from "@xyflow/react";

import type { AgentNodeData } from "./AgentNode/AgentNode";
import type { QueryNodeData } from "./QueryNode/QueryNode";
import type { ResultNodeData } from "./ResultNode/ResultNode";
import type { CursorState } from "./RemoteCursor/CollabOverlay";
import {
  ADS_ID,
  AGENT_ID,
  CHART_COLOR,
  CHART_ID,
  COLLAB_QUERY_ID,
  COLLAB_QUERY_POSITION,
  COLLAB_RESULT_ID,
  CURSOR_START,
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
  createCollabQueryNode,
  createCollabResultNode,
  createQueryNode,
  createResultNode,
  createSettingsNode,
  createVariableNode,
  floatingEdge,
  type DemoNode,
  type DemoPhase,
} from "./flowGraph";
import {
  AGENT_PROMPT,
  AGENT_REPLY,
  COLLAB_RESULT_ROWS,
  MULTIPLAYER_SQL,
  RESULT_COLUMNS,
  RESULT_ROWS,
  SQL_TEXT,
  type ResultRow,
} from "./data";

type Point = { x: number; y: number };

// the collab finale's choreography points (flow coords)
const CREATE_SCALE_START = 0.18;
const DRAG_SIZE = { w: 410, h: 150 }; // ~query-node size the cursor drags out
const RUN_POINT: Point = { x: 1530, y: 730 };
const RESULT_PARK_POINT: Point = { x: 2000, y: 710 };

export function useDemoFlow() {
  const { fitView, setCenter } = useReactFlow();
  const phase = useRef<DemoPhase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // The nodes carry their action handlers in `data`, but those handlers are
  // defined after the node state. Stable wrappers pointing at the latest
  // handler keep node-data identity steady while breaking the cycle.
  const sendRef = useRef<() => void>(() => {});
  const runRef = useRef<() => void>(() => {});
  const referenceRef = useRef<(userId: string) => void>(() => {});
  const chartRef = useRef<() => void>(() => {});
  const collabRunRef = useRef<() => void>(() => {});
  const onSend = useCallback(() => sendRef.current(), []);
  const onRun = useCallback(() => runRef.current(), []);
  const onReference = useCallback((userId: string) => referenceRef.current(userId), []);
  const onChart = useCallback(() => chartRef.current(), []);
  const onCollabRun = useCallback(() => collabRunRef.current(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<DemoNode>([createAgentNode(onSend)]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  // surfaced to the title bar so Anna's avatar pops in when she joins
  const [collabJoined, setCollabJoined] = useState(false);
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
    (to: Point, duration: number, opts?: { onStep?: (progress: number) => void; onDone?: () => void }) => {
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

  const streamSql = useCallback(() => {
    streamSqlInto(QUERY_ID, SQL_TEXT, () => {
      patchQueryById(QUERY_ID, { status: "ready" });
      deanimateEdge("agent-query");
      phase.current = "queryReady";
    });
  }, [streamSqlInto, patchQueryById, deanimateEdge]);

  const streamRows = useCallback(() => {
    streamRowsInto(RESULT_ID, RESULT_ROWS, () => {
      deanimateEdge("query-result");
      phase.current = "resultReady";
    });
  }, [streamRowsInto, deanimateEdge]);

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
          padding: 0.32,
          maxZoom: 1,
        }),
      );
      schedule(360, streamSql);
    });
  }, [patchAgent, schedule, setNodes, setEdges, fitView, streamSql, onRun, setCollabJoined, setCursor]);

  sendRef.current = send;

  const run = useCallback(() => {
    if (phase.current !== "queryReady" && phase.current !== "collab-finished") {
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
          padding: 0.3,
          maxZoom: 1,
        }),
      );
      schedule(360, streamRows);
    });
  }, [patchQueryById, schedule, setNodes, setEdges, fitView, streamRows, onReference, onChart]);

  runRef.current = run;

  // Click a user_id in the result → surface the rows that reference it. Clicking
  // a different id moves the reference subtree to that user.
  const reference = useCallback(
    (userId: string) => {
      if (
        phase.current !== "resultReady" &&
        phase.current !== "referenced" &&
        phase.current !== "collab-finished"
      ) {
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

  // ---- multiplayer finale: Anna joins, drags out a query and runs it ----

  const collabShowResult = useCallback(() => {
    patchQueryById(COLLAB_QUERY_ID, { status: "done" });

    setNodes(current => [...current, createCollabResultNode()]);
    setEdges(current => [
      ...current,
      {
        ...floatingEdge("collab-query-result", COLLAB_QUERY_ID, COLLAB_RESULT_ID, RESULT_COLOR),
        animated: true,
      },
    ]);
    phase.current = "collabResult";

    schedule(140, () =>
      fitView({
        nodes: [{ id: COLLAB_QUERY_ID }, { id: COLLAB_RESULT_ID }],
        duration: 800,
        padding: 0.3,
        maxZoom: 1,
      }),
    );
    // Anna's cursor settles beside her result and stays — she's still here
    schedule(320, () => glideCursor(RESULT_PARK_POINT, 700));
    schedule(380, () =>
      streamRowsInto(COLLAB_RESULT_ID, COLLAB_RESULT_ROWS, () => {
        deanimateEdge("collab-query-result");
        phase.current = "collab-finished";
        // hand the canvas back to the visitor — re-arm the agent + query actions
        patchAgent({ sent: false });
        patchQueryById(QUERY_ID, { status: "ready" });
      }),
    );
  }, [patchAgent, patchQueryById, setNodes, setEdges, schedule, fitView, glideCursor, streamRowsInto, deanimateEdge]);

  const collabRun = useCallback(() => {
    if (phase.current !== "collabQuery") {
      return;
    }
    phase.current = "collabRunning";
    pressCursor(true);
    schedule(300, () => pressCursor(false));
    patchQueryById(COLLAB_QUERY_ID, { status: "running" });
    schedule(700, collabShowResult);
  }, [pressCursor, schedule, patchQueryById, collabShowResult]);

  collabRunRef.current = collabRun;

  // Anna presses on empty canvas and drags the query node out; it grows from its
  // top-left under the cursor (like the product's place-tool), then streams SQL.
  const collabCreateQuery = useCallback(() => {
    pressCursor(true);
    setNodes(current => [...current, createCollabQueryNode(onCollabRun)]);
    phase.current = "collabQuery";

    const target = {
      x: cursorPos.current.x + DRAG_SIZE.w,
      y: cursorPos.current.y + DRAG_SIZE.h,
    };
    glideCursor(target, 750, {
      onStep: progress =>
        patchQueryById(COLLAB_QUERY_ID, {
          createScale: CREATE_SCALE_START + (1 - CREATE_SCALE_START) * progress,
        }),
      onDone: () => {
        pressCursor(false);
        patchQueryById(COLLAB_QUERY_ID, { createScale: 1 });
        schedule(120, () =>
          fitView({
            nodes: [{ id: COLLAB_QUERY_ID }],
            duration: 700,
            padding: 0.5,
            maxZoom: 1,
          }),
        );
        schedule(280, () =>
          streamSqlInto(COLLAB_QUERY_ID, MULTIPLAYER_SQL, () => {
            patchQueryById(COLLAB_QUERY_ID, { status: "ready" });
            // move onto the Run button, then "click" it
            glideCursor(RUN_POINT, 600, { onDone: () => schedule(220, collabRun) });
          }),
        );
      },
    });
  }, [pressCursor, setNodes, onCollabRun, glideCursor, patchQueryById, schedule, fitView, streamSqlInto, collabRun]);

  const startCollab = useCallback(() => {
    if (phase.current.startsWith("collab")) {
      return;
    }
    phase.current = "collabJoining";
    setCollabJoined(true);

    // Anna's cursor enters from off-canvas; the camera pans to the work area
    cursorPos.current = { ...CURSOR_START };
    setCursor({ x: CURSOR_START.x, y: CURSOR_START.y, pressed: false });
    schedule(60, () => glideCursor(COLLAB_QUERY_POSITION, 950));
    schedule(80, () => setCenter(1420, 720, { zoom: 0.8, duration: 950 }));
    schedule(1150, collabCreateQuery);
  }, [schedule, glideCursor, setCenter, collabCreateQuery]);

  // Visualize the result's numeric column as a bar chart node. The multiplayer
  // finale is now user-initiated via the titlebar Share button (startCollab).
  const chart = useCallback(() => {
    if (
      phase.current !== "resultReady" &&
      phase.current !== "referenced" &&
      phase.current !== "collab-finished"
    ) {
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
    phase.current = "charted";

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
  }, [clearTimers, setEdges, setNodes, onSend, schedule, fitView]);

  useEffect(() => clearTimers, [clearTimers]);

  return { nodes, edges, onNodesChange, onEdgesChange, reset, startCollab, collabJoined, cursor };
}
