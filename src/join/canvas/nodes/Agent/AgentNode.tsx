"use client";

// Web port of the desktop AgentNode: the transcript renders from synced node
// data as-is, but asking/stopping goes through the host proxy (the host runs
// the model) and the streaming partial arrives over gossip instead of a local
// Ollama stream.

import { NodeProps, NodeResizer } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useScrollFallthrough } from "../../hooks/useScrollFallthrough";
import { HiddenHandles } from "../HiddenHandles";
import { NodeHeader } from "../NodeHeader";
import { NodeIndicator } from "../NodeIndicator";
import { ChatInput } from "./ChatInput";
import { ChatEmptyState } from "./EmptyState";
import { MessageItem } from "./MessageItem";
import { MessageList } from "./MessageList";
import { ThinkingIndicator } from "./ThinkingIndicator";
import {
  agentIncomingAtom,
  cancelAgentRun,
  pendingAgentRunsAtom,
  requestAgentRun,
} from "../../../multiplayer/agentProxy";
import { guestSessionAtom } from "../../../multiplayer/state";
import type { AgentNode as AgentNodeT } from "../../types";
import "./agent.css";

const DEFAULT_W = 540;
const DEFAULT_H = 400;

export function AgentNode({ id, data, selected, width, height }: NodeProps<AgentNodeT>) {
  const [question, setQuestion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useScrollFallthrough(bodyRef);

  const session = useAtomValue(guestSessionAtom);
  const pendingRuns = useAtomValue(pendingAgentRunsAtom);
  const incomingMessage = useAtomValue(agentIncomingAtom(id));
  const isLoading = id in pendingRuns;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.messages.length, incomingMessage, isLoading]);

  const w = width ?? DEFAULT_W;
  const h = height ?? DEFAULT_H;

  const submit = () => {
    const q = question.trim();
    if (!q || !session || isLoading) {
      return;
    }
    setQuestion("");
    requestAgentRun(session, id, q).catch(() => {});
  };

  const stop = () => {
    if (session) {
      cancelAgentRun(session, id).catch(() => {});
    }
  };

  const hasVisibleMessages = data.messages.length > 0;

  return (
    <>
      <NodeResizer isVisible={!!selected} minWidth={400} minHeight={300} />
      <HiddenHandles connectableTarget />
      <div className={`app-node ${selected ? "selected" : ""}`} style={{ width: w, height: h }}>
        <NodeHeader nodeId={id} name='agent' indicator={<NodeIndicator kind='agent' />} />
        <div className='app-node-body nodrag' ref={bodyRef}>
          <div className='chat-container'>
            <div className='messages-container' ref={messagesScrollRef}>
              {hasVisibleMessages ? (
                <MessageList messages={data.messages} scrollRef={messagesScrollRef} />
              ) : (
                <ChatEmptyState />
              )}
              {incomingMessage && (
                <MessageItem
                  message={{
                    type: "assistant",
                    message: incomingMessage,
                    timestamp: Date.now(),
                  }}
                  index={data.messages.length}
                />
              )}
              {isLoading && !incomingMessage && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput
              value={question}
              onChange={setQuestion}
              onSubmit={submit}
              onStop={stop}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
}
