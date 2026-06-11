"use client";

import type { Node, NodeProps } from "@xyflow/react";

import styles from "./TextNode.module.css";

export type TextNodeData = {
  text: string;
};

export type TextFlowNode = Node<TextNodeData, "text">;

export function TextNode({ data }: NodeProps<TextFlowNode>) {
  return <div className={styles.node}>{data.text}</div>;
}
