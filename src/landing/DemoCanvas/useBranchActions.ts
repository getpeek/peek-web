"use client";

import { useCallback, type RefObject } from "react";

import {
  ADS_ID,
  CHART_COLOR,
  CHART_ID,
  COLLAB_ANIMATION_PHASES,
  REFERENCE_COLOR,
  RESULT_ID,
  SETTINGS_ID,
  createAdsNode,
  createChartNode,
  createSettingsNode,
  floatingEdge,
  type DemoPhase,
} from "./flowGraph";
import { RESULT_COLUMNS, RESULT_ROWS } from "./data";
import { track } from "@/metrics/track";
import type { useFlowPrimitives } from "./useFlowPrimitives";

type FlowPrimitives = ReturnType<typeof useFlowPrimitives>;

type BranchActionsOptions = Pick<
  FlowPrimitives,
  "setNodes" | "setEdges" | "schedule" | "fitView"
> & {
  phase: RefObject<DemoPhase>;
};

// The "Branch" half of the flow - the actions that grow new subtrees off the
// result node: following a referenced row, and charting the numeric column.
// Both are locked while the multiplayer finale owns the canvas.
export function useBranchActions(options: BranchActionsOptions) {
  const { phase, setNodes, setEdges, schedule, fitView } = options;

  // Click a user_id in the result → surface the rows that reference it. Clicking
  // a different id moves the reference subtree to that user.
  const reference = useCallback(
    (userId: string) => {
      if (COLLAB_ANIMATION_PHASES.includes(phase.current)) {
        return;
      }
      track("demo.reference");
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
    [phase, setNodes, setEdges, schedule, fitView],
  );

  // Visualize the result's numeric column as a bar chart node.
  const chart = useCallback(() => {
    if (COLLAB_ANIMATION_PHASES.includes(phase.current)) {
      return;
    }
    track("demo.chart");
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
  }, [phase, setNodes, setEdges, schedule, fitView]);

  return { reference, chart };
}
