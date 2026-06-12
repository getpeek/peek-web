"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { getStroke } from "perfect-freehand";

import styles from "./DrawNode.module.css";

// x, y, pressure - in node-local coordinates
export type DrawPoint = [number, number, number];

export type DrawNodeData = {
  strokes: DrawPoint[][];
  strokeWidth: number;
  color: string;
};

export type DrawFlowNode = Node<DrawNodeData, "draw">;

// Ported from the product's DrawNode: closes the perfect-freehand outline into
// a quadratic-bezier path that gets filled rather than stroked.
function getSvgPathFromStroke(stroke: number[][]): string {
  if (stroke.length === 0) {
    return "";
  }
  const d = stroke.reduce<number[]>((path, [x0, y0], i, arr) => {
    const [x1, y1] = arr[(i + 1) % arr.length];
    path.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    return path;
  }, []);

  return `M${d[0].toFixed(2)},${d[1].toFixed(2)} Q${d
    .slice(2)
    .map(n => n.toFixed(2))
    .join(" ")} Z`;
}

// Freehand pen marks, one filled path per pen stroke. Unlike the product's
// single-stroke node this one holds a whole doodle (the demo arrow is a curved
// shaft plus a V head) so the finale only manages one node.
export function DrawNode({ data, width, height }: NodeProps<DrawFlowNode>) {
  const paths = data.strokes.map(points =>
    getSvgPathFromStroke(
      getStroke(points, {
        size: data.strokeWidth * 4,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      }),
    ),
  );

  return (
    <div className={styles.node} style={{ width, height }}>
      <svg width={width} height={height} className={styles.surface}>
        {paths.map(d => (
          <path key={d} d={d} fill={data.color} />
        ))}
      </svg>
    </div>
  );
}
