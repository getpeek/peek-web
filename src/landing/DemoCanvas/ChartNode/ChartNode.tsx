"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import styles from "./ChartNode.module.css";

export type ChartNodeData = {
  title: string;
  valueColumn: string;
  values: number[];
};

export type ChartFlowNode = Node<ChartNodeData, "chart">;

const W = 392;
const H = 150;
const PAD_L = 34;
const PAD_R = 6;
const PAD_T = 8;
const PAD_B = 6;
const GAP = 4;
const TICKS = [0, 0.5, 1];

export function ChartNode({ data }: NodeProps<ChartFlowNode>) {
  const { title, valueColumn, values } = data;
  const max = Math.max(...values, 1);
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const baseline = PAD_T + innerH;
  const barWidth = (innerW - GAP * (values.length - 1)) / values.length;

  return (
    <div className={styles.node}>
      <Handle type="target" position={Position.Left} className={styles.handle} />

      <header className={styles.head}>
        <span className={styles.typeDot} />
        <span className={styles.typeTag}>CHART · BAR</span>
        <span className={styles.title}>{title}</span>
      </header>

      <div className={styles.body}>
        <div className={styles.cap}>
          <span className={styles.capTitle}>{valueColumn}</span>
          <span className={styles.capMeta}>top {values.length} · auto</span>
        </div>

        <svg
          className={styles.svg}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
        >
          {TICKS.map((t) => {
            const y = PAD_T + (1 - t) * innerH;
            return (
              <g key={t}>
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={y}
                  y2={y}
                  className={styles.axis}
                  strokeDasharray="2 3"
                />
                <text x={2} y={y + 3} className={styles.tick}>
                  {Math.round(max * t)}
                </text>
              </g>
            );
          })}
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={baseline}
            y2={baseline}
            className={styles.axis}
          />

          {values.map((value, index) => {
            const barHeight = (value / max) * innerH;
            const x = PAD_L + index * (barWidth + GAP);
            return (
              <rect
                key={index}
                className={index % 2 === 1 ? styles.barAlt : styles.bar}
                x={x}
                y={baseline - barHeight}
                width={barWidth}
                height={barHeight}
                rx={1.5}
                style={{ animationDelay: `${index * 50}ms` }}
              />
            );
          })}
        </svg>
      </div>

      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
}
