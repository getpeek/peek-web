"use client";

import { useCallback, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";

import {
  COLLAB_QUERY_ID,
  COLLAB_QUERY_POSITION,
  COLLAB_RESULT_ID,
  CURSOR_START,
  RESULT_COLOR,
  createCollabQueryNode,
  createCollabResultNode,
  floatingEdge,
  type DemoPhase,
} from "./flowGraph";
import { COLLAB_RESULT_ROWS, MULTIPLAYER_SQL } from "./data";
import { useCollabAnnotation } from "./useCollabAnnotation";
import type { Point, useFlowPrimitives } from "./useFlowPrimitives";

// the collab finale's choreography points (flow coords)
const CREATE_SCALE_START = 0.18;
const DRAG_SIZE = { w: 410, h: 150 };
const RUN_POINT: Point = { x: 1530, y: 1030 };
const RESULT_PARK_POINT: Point = { x: 2000, y: 1010 };

type FlowPrimitives = ReturnType<typeof useFlowPrimitives>;

type CollabFinaleOptions = Pick<
  FlowPrimitives,
  | "setNodes"
  | "setEdges"
  | "setCursor"
  | "cursorPos"
  | "fitView"
  | "setCenter"
  | "schedule"
  | "glideCursor"
  | "pressCursor"
  | "patchAgent"
  | "patchQueryById"
  | "streamSqlInto"
  | "streamRowsInto"
  | "streamTextInto"
  | "traceStroke"
  | "deanimateEdge"
> & {
  phase: RefObject<DemoPhase>;
  setCollabJoined: Dispatch<SetStateAction<boolean>>;
};

// Multiplayer finale: Anna joins, drags a query node out of empty canvas, runs
// it, then doodles a freehand arrow at her result and leaves a hand-written
// note. The whole sequence drives the canvas autonomously; useDemoFlow locks
// the visitor's own node actions while it plays and hands control back when it
// finishes.
export function useCollabFinale(options: CollabFinaleOptions) {
  const {
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
    streamTextInto,
    traceStroke,
    deanimateEdge,
  } = options;

  // collabRun is referenced by the node it spawns (createCollabQueryNode) before
  // it's defined; a stable wrapper pointing at the latest handler breaks the cycle.
  const collabRunRef = useRef<() => void>(() => {});
  const onCollabRun = useCallback(() => collabRunRef.current(), []);

  const collabAnnotate = useCollabAnnotation({
    phase,
    setNodes,
    fitView,
    schedule,
    glideCursor,
    pressCursor,
    patchAgent,
    patchQueryById,
    streamTextInto,
    traceStroke,
  });

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
    // Anna's cursor settles beside her result — a beat before she starts drawing
    schedule(320, () => glideCursor(RESULT_PARK_POINT, 700));
    schedule(380, () =>
      streamRowsInto(COLLAB_RESULT_ID, COLLAB_RESULT_ROWS, () => {
        deanimateEdge("collab-query-result");
        collabAnnotate();
      }),
    );
  }, [
    phase,
    patchQueryById,
    setNodes,
    setEdges,
    schedule,
    fitView,
    glideCursor,
    streamRowsInto,
    deanimateEdge,
    collabAnnotate,
  ]);

  const collabRun = useCallback(() => {
    if (phase.current !== "collabQuery") {
      return;
    }
    phase.current = "collabRunning";
    pressCursor(true);
    schedule(300, () => pressCursor(false));
    patchQueryById(COLLAB_QUERY_ID, { status: "running" });
    schedule(700, collabShowResult);
  }, [phase, pressCursor, schedule, patchQueryById, collabShowResult]);

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
  }, [
    phase,
    cursorPos,
    pressCursor,
    setNodes,
    onCollabRun,
    glideCursor,
    patchQueryById,
    schedule,
    fitView,
    streamSqlInto,
    collabRun,
  ]);

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
    schedule(80, () => setCenter(1420, 1020, { zoom: 0.8, duration: 950 }));
    schedule(1150, collabCreateQuery);
  }, [
    phase,
    cursorPos,
    setCollabJoined,
    setCursor,
    schedule,
    glideCursor,
    setCenter,
    collabCreateQuery,
  ]);

  return startCollab;
}
