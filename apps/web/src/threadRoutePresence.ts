import { type ThreadId } from "@t3tools/contracts";

import { type DraftThreadState } from "./composerDraftStore";
import { type Thread } from "./types";

interface ResolveRouteThreadPresenceInput {
  threadId: ThreadId;
  threads: ReadonlyArray<Pick<Thread, "id">>;
  draftThreadsByThreadId: Readonly<Record<ThreadId, DraftThreadState>>;
}

export interface RouteThreadPresence {
  existsAsServerThread: boolean;
  existsAsDraftThread: boolean;
  routeThreadExists: boolean;
}

export function getDraftThreadStateById(
  threadId: ThreadId,
  draftThreadsByThreadId: Readonly<Record<ThreadId, DraftThreadState>>,
): DraftThreadState | null {
  return draftThreadsByThreadId[threadId] ?? null;
}

export function resolveRouteThreadPresence(
  input: ResolveRouteThreadPresenceInput,
): RouteThreadPresence {
  const existsAsServerThread = input.threads.some((thread) => thread.id === input.threadId);
  const existsAsDraftThread =
    getDraftThreadStateById(input.threadId, input.draftThreadsByThreadId) !== null;

  return {
    existsAsServerThread,
    existsAsDraftThread,
    routeThreadExists: existsAsServerThread || existsAsDraftThread,
  };
}
