"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { tokenizeSqlLine } from "./highlight";
import styles from "./QueryNode.module.css";

export type QueryStatus = "streaming" | "ready" | "running" | "done";

export type QueryNodeData = {
  title: string;
  meta: string;
  sql: string;
  status: QueryStatus;
  onRun: () => void;
  // when set, the node renders scaled from its top-left — drives the "drag to
  // create" grow-out in the multiplayer demo (0 → 1 as the cursor drags)
  createScale?: number;
};

export type QueryFlowNode = Node<QueryNodeData, "query">;

export function QueryNode({ data }: NodeProps<QueryFlowNode>) {
  const { title, meta, sql, status, onRun, createScale } = data;
  const lines = sql.split("\n");
  const busy = status === "streaming" || status === "running";
  const creating = createScale !== undefined;

  return (
    <div
      className={`${styles.node} ${creating ? styles.creating : ""}`}
      style={creating ? { transform: `scale(${createScale})`, transformOrigin: "top left" } : undefined}
    >
      <Handle type='target' position={Position.Left} className={styles.handle} />

      <header className={styles.head}>
        <span className={styles.typeDot} />
        <span className={styles.typeTag}>QUERY</span>
        <span className={styles.title}>{title}</span>
      </header>

      <div className={styles.body}>
        <div className={`${styles.sqlBlock} ${busy ? styles.streaming : ""}`}>
          <div className={styles.gutter}>
            {lines.map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <div className={styles.code}>
            {lines.map((line, index) => (
              <div key={index} className={styles.codeRow}>
                {tokenizeSqlLine(line).map((token, tokenIndex) => (
                  <span key={tokenIndex} className={styles[token.kind]}>
                    {token.value}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.foot}>
          <span className={styles.meta}>{meta}</span>
          {status === "streaming" ? null : (
            <button
              type='button'
              className={`${styles.run} pk-shimmer`}
              onClick={onRun}
              disabled={status !== "ready"}
              aria-label='Run query'
            >
              {status === "running" ? (
                <svg
                  className={styles.spinner}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={3}
                  strokeLinecap='round'
                >
                  <circle cx='12' cy='12' r='9' strokeDasharray='40 20' />
                </svg>
              ) : (
                <svg viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M5 3l14 9-14 9z' />
                </svg>
              )}
              {status === "running" ? "Running" : "Run"}
            </button>
          )}
        </div>
      </div>

      <Handle type='source' position={Position.Right} className={styles.handle} />
    </div>
  );
}
