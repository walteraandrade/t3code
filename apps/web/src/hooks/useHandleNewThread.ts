import { DEFAULT_RUNTIME_MODE, type ProjectId, ThreadId } from "@t3tools/contracts";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  type DraftThreadEnvMode,
  type DraftThreadState,
  useComposerDraftStore,
} from "../composerDraftStore";
import { newThreadId } from "../lib/utils";
import { orderItemsByPreferredIds } from "../components/Sidebar.logic";
import { useStore } from "../store";
import { useThreadById } from "../storeSelectors";
import { useUiStateStore } from "../uiStateStore";
import { resolveNewThreadTarget } from "./useHandleNewThread.logic";

export function useHandleNewThread() {
  const projectIds = useStore(useShallow((store) => store.projects.map((project) => project.id)));
  const projectOrder = useUiStateStore((store) => store.projectOrder);
  const navigate = useNavigate();
  const routeThreadId = useParams({
    strict: false,
    select: (params) => (params.threadId ? ThreadId.makeUnsafe(params.threadId) : null),
  });
  const activeThread = useThreadById(routeThreadId);
  const activeDraftThread = useComposerDraftStore((store) =>
    routeThreadId ? (store.draftThreadsByThreadId[routeThreadId] ?? null) : null,
  );
  const orderedProjects = useMemo(() => {
    return orderItemsByPreferredIds({
      items: projectIds,
      preferredIds: projectOrder,
      getId: (projectId) => projectId,
    });
  }, [projectIds, projectOrder]);

  const handleNewThread = useCallback(
    (
      projectId: ProjectId,
      options?: {
        branch?: string | null;
        worktreePath?: string | null;
        envMode?: DraftThreadEnvMode;
      },
    ): Promise<void> => {
      const {
        clearProjectDraftThreadId,
        getDraftThread,
        getDraftThreadByProjectId,
        applyStickyState,
        setDraftThreadContext,
        setProjectDraftThreadId,
      } = useComposerDraftStore.getState();
      const hasBranchOption = options?.branch !== undefined;
      const hasWorktreePathOption = options?.worktreePath !== undefined;
      const hasEnvModeOption = options?.envMode !== undefined;
      const storedDraftThread = getDraftThreadByProjectId(projectId);
      const latestActiveDraftThread: DraftThreadState | null = routeThreadId
        ? getDraftThread(routeThreadId)
        : null;
      const resolvedDraftTarget = resolveNewThreadTarget({
        projectId,
        routeThreadId,
        routeDraftThread: latestActiveDraftThread,
        storedProjectDraftThread: storedDraftThread,
        draftContextOverrides: options,
        freshThreadId: newThreadId(),
      });
      const createdAt = new Date().toISOString();

      return (async () => {
        if (
          resolvedDraftTarget.action !== "create-new" &&
          (hasBranchOption || hasWorktreePathOption || hasEnvModeOption)
        ) {
          setDraftThreadContext(resolvedDraftTarget.threadId, resolvedDraftTarget.draftContext);
        }

        if (resolvedDraftTarget.action === "create-new") {
          clearProjectDraftThreadId(projectId);
          setProjectDraftThreadId(projectId, resolvedDraftTarget.threadId, {
            createdAt,
            branch: resolvedDraftTarget.draftContext.branch,
            worktreePath: resolvedDraftTarget.draftContext.worktreePath,
            envMode: resolvedDraftTarget.draftContext.envMode,
            runtimeMode: DEFAULT_RUNTIME_MODE,
          });
          applyStickyState(resolvedDraftTarget.threadId);

          const createdDraftThread =
            useComposerDraftStore.getState().draftThreadsByThreadId[resolvedDraftTarget.threadId];
          if (!createdDraftThread) {
            throw new Error(
              `New-thread draft write did not persist for thread ${resolvedDraftTarget.threadId}.`,
            );
          }
        } else {
          setProjectDraftThreadId(projectId, resolvedDraftTarget.threadId);
        }

        if (routeThreadId === resolvedDraftTarget.threadId) {
          return;
        }

        await navigate({
          to: "/$threadId",
          params: { threadId: resolvedDraftTarget.threadId },
        });
      })();
    },
    [navigate, routeThreadId],
  );

  return {
    activeDraftThread,
    activeThread,
    defaultProjectId: orderedProjects[0] ?? null,
    handleNewThread,
    routeThreadId,
  };
}
