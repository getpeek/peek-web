"use client";

// Web port of the desktop QueryError node minus the "Suggest fix" flow — that
// runs a local Ollama prompt, which a guest doesn't have. Errors stream in
// from the host like any other node.

import { NodeProps, NodeResizer } from "@xyflow/react";
import { useRef } from "react";
import { useScrollFallthrough } from "../../hooks/useScrollFallthrough";
import { HiddenHandles } from "../HiddenHandles";
import { NodeHeader } from "../NodeHeader";
import { NodeIndicator } from "../NodeIndicator";
import type { QueryErrorNode as QueryErrorNodeT } from "../../types";
import "./QueryError.css";

const DEFAULT_W = 400;
const DEFAULT_H = 300;

export function QueryErrorNode({ id, data, selected, width, height }: NodeProps<QueryErrorNodeT>) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useScrollFallthrough(bodyRef);

  const w = width ?? DEFAULT_W;
  const h = height ?? DEFAULT_H;

  return (
    <>
      <NodeResizer isVisible={!!selected} minWidth={300} minHeight={200} />
      <HiddenHandles />
      <div className={`app-node ${selected ? "selected" : ""}`} style={{ width: w, height: h }}>
        <NodeHeader
          nodeId={id}
          name='query failed'
          indicator={<NodeIndicator kind='query-error' />}
        />
        <div className='app-node-body nodrag' ref={bodyRef}>
          <div className='error-shape'>
            <div>{data.message}</div>
          </div>
        </div>
      </div>
    </>
  );
}
