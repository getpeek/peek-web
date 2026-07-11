// Web variant of the desktop `useExecuteQueries`, same call shape. A guest
// never has a DB connection, so every run takes the desktop's joiner path:
// forward to the host via an `exec-requests/<id>` doc entry and let the
// results stream back through normal sync.

import { useAtomValue } from "jotai";
import { useCanvas } from "./useCanvas";
import { guestSessionAtom } from "../../multiplayer/state";
import type { AppNode, QueryData } from "../types";

export const useExecuteQueries = () => {
  const canvas = useCanvas();
  const session = useAtomValue(guestSessionAtom);
  return async (sourceNode: AppNode, queries: string[]) => {
    if (!session) {
      return;
    }
    // Optimistically reflect in-flight state locally; the host will overwrite
    // both true→true and the eventual false via doc sync.
    if (sourceNode.type === "query") {
      canvas.updateNodeData<QueryData>(sourceNode.id, { isRunning: true });
    }
    await session.requestExec(sourceNode.id, queries);
  };
};
