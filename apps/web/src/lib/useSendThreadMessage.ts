import { useCallback } from "react";
import type { ThreadId } from "@t3tools/contracts";
import { readNativeApi } from "~/nativeApi";
import { useStore } from "~/store";
import { DEFAULT_INTERACTION_MODE, DEFAULT_RUNTIME_MODE } from "~/types";
import { newCommandId, newMessageId } from "./utils";

export const useSendThreadMessage = (threadId: ThreadId | null) => {
  const thread = useStore((s) => s.threads.find((t) => t.id === threadId) ?? null);

  return useCallback(
    async (text: string): Promise<void> => {
      if (!threadId || !thread) return;
      const api = readNativeApi();
      if (!api) return;
      await api.orchestration.dispatchCommand({
        type: "thread.turn.start",
        commandId: newCommandId(),
        threadId,
        message: {
          messageId: newMessageId(),
          role: "user",
          text,
          attachments: [],
        },
        modelSelection: thread.modelSelection,
        runtimeMode: thread.runtimeMode ?? DEFAULT_RUNTIME_MODE,
        interactionMode: thread.interactionMode ?? DEFAULT_INTERACTION_MODE,
        createdAt: new Date().toISOString(),
      });
    },
    [threadId, thread],
  );
};
