import { type ProjectId, type ThreadId } from "@t3tools/contracts";

import { type DraftThreadEnvMode, type DraftThreadState } from "../composerDraftStore";

interface DraftContextOverrides {
  branch?: string | null;
  worktreePath?: string | null;
  envMode?: DraftThreadEnvMode;
}

interface ProjectDraftThread extends DraftThreadState {
  threadId: ThreadId;
}

interface ResolveNewThreadTargetInput {
  projectId: ProjectId;
  routeThreadId: ThreadId | null;
  routeDraftThread: DraftThreadState | null;
  storedProjectDraftThread: ProjectDraftThread | null;
  draftContextOverrides: DraftContextOverrides | undefined;
  freshThreadId: ThreadId;
}

export interface ResolvedNewThreadTarget {
  threadId: ThreadId;
  action: "reuse-stored" | "reuse-active" | "create-new";
  draftContext: {
    branch: string | null;
    worktreePath: string | null;
    envMode: DraftThreadEnvMode;
  };
}

function resolveDraftContext(
  baseDraftThread: DraftThreadState | null,
  overrides: DraftContextOverrides | undefined,
): ResolvedNewThreadTarget["draftContext"] {
  const worktreePath =
    overrides?.worktreePath === undefined
      ? (baseDraftThread?.worktreePath ?? null)
      : (overrides.worktreePath ?? null);

  return {
    branch:
      overrides?.branch === undefined
        ? (baseDraftThread?.branch ?? null)
        : (overrides.branch ?? null),
    worktreePath,
    envMode:
      overrides?.envMode ?? (worktreePath ? "worktree" : (baseDraftThread?.envMode ?? "local")),
  };
}

export function resolveNewThreadTarget(
  input: ResolveNewThreadTargetInput,
): ResolvedNewThreadTarget {
  if (input.storedProjectDraftThread) {
    return {
      threadId: input.storedProjectDraftThread.threadId,
      action: "reuse-stored",
      draftContext: resolveDraftContext(
        input.storedProjectDraftThread,
        input.draftContextOverrides,
      ),
    };
  }

  if (
    input.routeThreadId &&
    input.routeDraftThread &&
    input.routeDraftThread.projectId === input.projectId
  ) {
    return {
      threadId: input.routeThreadId,
      action: "reuse-active",
      draftContext: resolveDraftContext(input.routeDraftThread, input.draftContextOverrides),
    };
  }

  return {
    threadId: input.freshThreadId,
    action: "create-new",
    draftContext: resolveDraftContext(null, input.draftContextOverrides),
  };
}
