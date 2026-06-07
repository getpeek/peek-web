"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { QUERY_META, QUERY_TITLE } from "../data";
import { tokenizeSqlLine } from "./highlight";
import styles from "./QueryNode.module.css";

export type QueryStatus = "streaming" | "ready" | "running" | "done";

export type QueryNodeData = {
  sql: string;
  status: QueryStatus;
  onRun: () => void;
};

export type QueryFlowNode = Node<QueryNodeData, "query">;

export function QueryNode({ data }: NodeProps<QueryFlowNode>) {
  const { sql, status, onRun } = data;
  const lines = sql.split("\n");
  const busy = status === "streaming" || status === "running";

  return (
    <div className={styles.node}>
      <Handle type='target' position={Position.Left} className={styles.handle} />

      <header className={styles.head}>
        <span className={styles.typeDot} />
        <span className={styles.typeTag}>QUERY</span>
        <span className={styles.title}>{QUERY_TITLE}</span>
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
          <span className={styles.meta}>{QUERY_META}</span>
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
