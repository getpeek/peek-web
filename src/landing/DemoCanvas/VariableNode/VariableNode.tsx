"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import styles from "./VariableNode.module.css";

export type VariableNodeData = {
  name: string;
  value: string;
};

export type VariableFlowNode = Node<VariableNodeData, "variable">;

export function VariableNode({ data }: NodeProps<VariableFlowNode>) {
  const { name, value } = data;

  return (
    <div className={styles.node}>
      <Handle type='target' position={Position.Left} className={styles.handle} />

      <header className={styles.head}>
        <span className={styles.typeDot} />
        <span className={styles.typeTag}>VARIABLE</span>
      </header>

      <div className={styles.body}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td className={styles.nameCell}>
                <span className={styles.sigil}>@</span>
                <span className={styles.name}>{name}</span>
              </td>
              <td className={styles.valueCell}>{value}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Handle type='source' position={Position.Right} className={styles.handle} />
    </div>
  );
}
