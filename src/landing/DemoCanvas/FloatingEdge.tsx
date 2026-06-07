"use client";

import { BaseEdge, getBezierPath, useInternalNode, type EdgeProps } from "@xyflow/react";

import { getEdgeParams } from "./edges";

// Edge that always connects the facing sides of the source/target nodes,
// recomputed each render from live node positions — stays well-routed as nodes
// are dragged to either side instead of clinging to fixed handles.
export function FloatingEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [path] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  });

  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
}
