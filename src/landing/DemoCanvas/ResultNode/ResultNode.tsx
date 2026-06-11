"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import type { ResultColumn, ResultRow } from "../data";
import styles from "./ResultNode.module.css";

export type ResultNodeData = {
  title: string;
  meta: string;
  total: number;
  columns: ResultColumn[];
  rows: ResultRow[];
  width?: number;
  // when set, cells in this column become "follow reference" triggers
  referenceColumn?: string;
  onReference?: (value: string) => void;
  // when set (and a numeric column exists), shows a "visualize" chart button
  onChart?: () => void;
};

export type ResultFlowNode = Node<ResultNodeData, "result">;

export function ResultNode({ data }: NodeProps<ResultFlowNode>) {
  const { title, meta, total, columns, rows, width, referenceColumn, onReference, onChart } = data;
  const keyColumn = columns[0].key;
  const hasNumericColumn = columns.some(column => column.kind === "num");

  return (
    <div className={styles.node} style={{ width: width ?? 380 }}>
      <Handle type='target' position={Position.Left} className={styles.handle} />

      <header className={styles.head}>
        <span className={styles.typeDot} />
        <span className={styles.typeTag}>RESULT</span>
        <span className={styles.title}>
          {title} · {total} rows
        </span>
      </header>

      <div className={styles.toolbar}>
        <span className={styles.ok}>{rows.length} rows</span>
        <span className={styles.dim}>· {meta}</span>
        {hasNumericColumn && onChart ? (
          <button
            type='button'
            className={`${styles.chartBtn} pk-glow pk-shimmer`}
            onClick={onChart}
            title='Visualize as a bar chart'
          >
            <svg
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M3 3v18h18' />
              <rect x='7' y='11' width='3' height='6' />
              <rect x='12' y='7' width='3' height='10' />
              <rect x='17' y='13' width='3' height='4' />
            </svg>
            Chart
          </button>
        ) : null}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.key} className={column.kind === "num" ? styles.numHead : undefined}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={String(row[keyColumn])} className={styles.row}>
                {columns.map(column => (
                  <Cell
                    key={column.key}
                    column={column}
                    value={row[column.key]}
                    clickable={column.key === referenceColumn && Boolean(onReference)}
                    onReference={onReference}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Handle type='source' position={Position.Right} className={styles.handle} />
    </div>
  );
}

function Cell({
  column,
  value,
  clickable,
  onReference,
}: {
  column: ResultColumn;
  value: string | number;
  clickable: boolean;
  onReference?: (value: string) => void;
}) {
  const display = typeof value === "number" ? value.toLocaleString("en-US") : value;
  const className =
    column.kind === "pk"
      ? styles.pk
      : column.kind === "fk"
        ? styles.fk
        : column.kind === "num"
          ? styles.num
          : undefined;

  if (clickable && onReference) {
    return (
      <td className={className}>
        <button
          type='button'
          className={styles.refCell}
          onClick={() => onReference(String(value))}
          title='Show rows that reference this id'
        >
          {display}
          <svg
            className={styles.refIcon}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2.4}
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M7 17 17 7M9 7h8v8' />
          </svg>
        </button>
      </td>
    );
  }

  return <td className={className}>{display}</td>;
}
