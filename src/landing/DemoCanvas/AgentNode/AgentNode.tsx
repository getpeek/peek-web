"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import { AGENT_EMPTY_SUBTITLE, AGENT_EMPTY_TITLE, AGENT_MODEL } from "../data";
import styles from "./AgentNode.module.css";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type AgentNodeData = {
  draft: string;
  messages: ChatMessage[];
  thinking: boolean;
  sent: boolean;
  onSend: () => void;
};

export type AgentFlowNode = Node<AgentNodeData, "agent">;

export function AgentNode({ data }: NodeProps<AgentFlowNode>) {
  const { draft, messages, thinking, sent, onSend } = data;
  const showEmpty = messages.length === 0 && !thinking;

  return (
    <div className={styles.node}>
      <Handle type='target' position={Position.Left} className={styles.handle} />

      <header className={styles.head}>
        <span className={styles.typeDot} />
        <span className={styles.typeTag}>AGENT</span>
        <span className={styles.title}>{AGENT_MODEL}</span>
      </header>

      <div className={styles.messages}>
        {showEmpty ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>{AGENT_EMPTY_TITLE}</p>
            <p className={styles.emptySub}>{AGENT_EMPTY_SUBTITLE}</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <Message key={message.id} message={message} />
            ))}
            {thinking ? <Thinking /> : null}
          </>
        )}
      </div>

      <div className={styles.composer}>
        <textarea
          className={styles.input}
          value={draft}
          readOnly
          rows={2}
          placeholder='Ask anything about your data…'
        />
        <button
          type='button'
          className={`${styles.send} pk-glow pk-shimmer`}
          onClick={onSend}
          disabled={sent}
          aria-label='Send message'
        >
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2.4}
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M5 12h14M13 5l7 7-7 7' />
          </svg>
        </button>
      </div>

      <Handle type='source' position={Position.Right} className={styles.handle} />
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={styles.msg}>
      <div className={styles.msgRole}>
        <span className={isUser ? styles.dotUser : styles.dotBot} />
        <span className={isUser ? styles.roleUser : styles.roleBot}>
          {isUser ? "YOU" : `PEEK · ${AGENT_MODEL}`}
        </span>
      </div>
      <p className={styles.msgText}>{message.text}</p>
    </div>
  );
}

function Thinking() {
  return (
    <div className={styles.msg}>
      <div className={styles.msgRole}>
        <span className={styles.dotBot} />
        <span className={styles.roleBot}>PEEK · {AGENT_MODEL}</span>
      </div>
      <div className={styles.thinking}>
        <span className={styles.thLabel}>Thinking</span>
        <span className={styles.thDots}>
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}
