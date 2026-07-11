// Types-only stub of the desktop `src/canvas/hooks/useExecutePrompt.ts`. The
// desktop version runs Ollama locally; on the web every agent run is proxied
// to the host, so only the message shapes are needed here.

export interface ToolCall {
  id: string;
  name: string;
  args: unknown;
}

export interface Message {
  type: "user" | "assistant" | "system" | "context" | "tool_call" | "tool_result";
  message: string;
  timestamp: number;
  contextKey?: string;
  contextKind?: "schema" | "result";
  toolCalls?: ToolCall[];
  toolCallId?: string;
  toolName?: string;
  isError?: boolean;
}
