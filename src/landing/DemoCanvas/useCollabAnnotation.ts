"use client";

import { useCallback, type RefObject } from "react";

import {
  COLLAB_ARROW_ID,
  COLLAB_ARROW_POSITION,
  COLLAB_QUERY_ID,
  COLLAB_RESULT_ID,
  COLLAB_TEXT_ID,
  COLLAB_TEXT_POSITION,
  QUERY_ID,
  createCollabArrowNode,
  createCollabTextNode,
  type DemoPhase,
} from "./flowGraph";
import { ARROW_HEAD, ARROW_SHAFT, COLLAB_NOTE_TEXT } from "./data";
import type { Point, useFlowPrimitives } from "./useFlowPrimitives";

// the annotation's choreography points (flow coords):
// pen-down points for the arrow strokes — arrow origin + each stroke's first sample
const SHAFT_START: Point = {
  x: COLLAB_ARROW_POSITION.x + ARROW_SHAFT[0][0],
  y: COLLAB_ARROW_POSITION.y + ARROW_SHAFT[0][1],
};
const HEAD_START: Point = {
  x: COLLAB_ARROW_POSITION.x + ARROW_HEAD[0][0],
  y: COLLAB_ARROW_POSITION.y + ARROW_HEAD[0][1],
};
// where Anna hovers while her note types on, then settles for good
const NOTE_POINT: Point = { x: COLLAB_TEXT_POSITION.x - 28, y: COLLAB_TEXT_POSITION.y + 70 };
const NOTE_PARK_POINT: Point = { x: 1700, y: 1330 };

type FlowPrimitives = ReturnType<typeof useFlowPrimitives>;

type CollabAnnotationOptions = Pick<
  FlowPrimitives,
  | "setNodes"
  | "fitView"
  | "schedule"
  | "glideCursor"
  | "pressCursor"
  | "patchAgent"
  | "patchQueryById"
  | "streamTextInto"
  | "traceStroke"
> & {
  phase: RefObject<DemoPhase>;
};

// The finale's epilogue: Anna doodles a freehand arrow pointing at her result,
// then writes "Multiplayer support :)" beside it in the product's playful
// Text-node hand. Only after the note finishes is the canvas handed back to
// the visitor.
export function useCollabAnnotation(options: CollabAnnotationOptions) {
  const {
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
  } = options;

  const writeNote = useCallback(() => {
    pressCursor(false);
    schedule(240, () =>
      glideCursor(NOTE_POINT, 500, {
        onDone: () =>
          streamTextInto(COLLAB_TEXT_ID, COLLAB_NOTE_TEXT, () => {
            glideCursor(NOTE_PARK_POINT, 500);
            phase.current = "collab-finished";
            // hand the canvas back to the visitor — re-arm the agent + query actions
            patchAgent({ sent: false });
            patchQueryById(QUERY_ID, { status: "ready" });
          }),
      }),
    );
  }, [phase, pressCursor, schedule, glideCursor, streamTextInto, patchAgent, patchQueryById]);

  const drawArrowHead = useCallback(() => {
    pressCursor(false);
    // a short pen lift, then the V head over the shaft's tip
    schedule(160, () =>
      glideCursor(HEAD_START, 200, {
        onDone: () => {
          pressCursor(true);
          traceStroke({
            id: COLLAB_ARROW_ID,
            origin: COLLAB_ARROW_POSITION,
            points: ARROW_HEAD,
            baseStrokes: [ARROW_SHAFT],
            onDone: writeNote,
          });
        },
      }),
    );
  }, [pressCursor, schedule, glideCursor, traceStroke, writeNote]);

  const collabAnnotate = useCallback(() => {
    phase.current = "collabDrawing";
    setNodes(current => [...current, createCollabArrowNode(), createCollabTextNode()]);

    // let the (empty but pre-sized) annotation nodes mount + measure, then
    // widen the camera over the whole collab cluster so the drawing is on screen
    schedule(180, () =>
      fitView({
        nodes: [
          { id: COLLAB_QUERY_ID },
          { id: COLLAB_RESULT_ID },
          { id: COLLAB_ARROW_ID },
          { id: COLLAB_TEXT_ID },
        ],
        duration: 700,
        padding: 0.25,
        maxZoom: 1,
      }),
    );

    // the result-park glide is still in flight when this fires (~530ms left);
    // waiting it out keeps two cursor tweens from fighting over the position
    schedule(750, () =>
      glideCursor(SHAFT_START, 600, {
        onDone: () => {
          pressCursor(true);
          traceStroke({
            id: COLLAB_ARROW_ID,
            origin: COLLAB_ARROW_POSITION,
            points: ARROW_SHAFT,
            baseStrokes: [],
            onDone: drawArrowHead,
          });
        },
      }),
    );
  }, [phase, setNodes, schedule, fitView, glideCursor, pressCursor, traceStroke, drawArrowHead]);

  return collabAnnotate;
}
