"use client";

// Stand-ins for node kinds the web guest doesn't render yet (bar charts pull
// in the desktop's charting stack; table definitions need the schema layout).
// They keep the node's footprint and chrome so the canvas layout matches the
// host's.

import { NodeProps, NodeResizer } from "@xyflow/react";
import { HiddenHandles } from "./HiddenHandles";
import { NodeHeader } from "./NodeHeader";
import { NodeIndicator } from "./NodeIndicator";
import type { AppNode, AppNodeType } from "../types";

function makePlaceholder(kind: AppNodeType, name: string) {
  return function PlaceholderNode({ id, selected, width, height }: NodeProps<AppNode>) {
    return (
      <>
        <NodeResizer isVisible={!!selected} minWidth={220} minHeight={120} />
        <HiddenHandles />
        <div
          className={`app-node ${selected ? "selected" : ""}`}
          style={{ width: width ?? 320, height: height ?? 200 }}
        >
          <NodeHeader nodeId={id} name={name} indicator={<NodeIndicator kind={kind} />} />
          <div className='app-node-body nodrag' style={{ display: "grid", placeItems: "center" }}>
            <span style={{ color: "var(--pk-fg-muted)", font: "500 12px var(--pk-font-sans)" }}>
              Not available in shared sessions yet — visible on the host.
            </span>
          </div>
        </div>
      </>
    );
  };
}

export const BarChartPlaceholderNode = makePlaceholder("barchart", "bar chart");
export const TableDefinitionPlaceholderNode = makePlaceholder("table-definition", "table");
