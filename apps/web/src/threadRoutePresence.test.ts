import { describe, expect, it } from "vitest";
import { type ProjectId, type ThreadId } from "@t3tools/contracts";

import { resolveRouteThreadPresence } from "./threadRoutePresence";

const THREAD_ID = "thread-route-presence-test" as ThreadId;
const PROJECT_ID = "project-route-presence-test" as ProjectId;

describe("resolveRouteThreadPresence", () => {
  it("reports server-thread presence", () => {
    expect(
      resolveRouteThreadPresence({
        threadId: THREAD_ID,
        threads: [{ id: THREAD_ID }],
        draftThreadsByThreadId: {},
      }),
    ).toEqual({
      existsAsServerThread: true,
      existsAsDraftThread: false,
      routeThreadExists: true,
    });
  });

  it("reports draft-thread presence", () => {
    expect(
      resolveRouteThreadPresence({
        threadId: THREAD_ID,
        threads: [],
        draftThreadsByThreadId: {
          [THREAD_ID]: {
            projectId: PROJECT_ID,
            createdAt: "2026-03-26T00:00:00.000Z",
            runtimeMode: "full-access",
            interactionMode: "default",
            branch: null,
            worktreePath: null,
            envMode: "local",
          },
        },
      }),
    ).toEqual({
      existsAsServerThread: false,
      existsAsDraftThread: true,
      routeThreadExists: true,
    });
  });

  it("reports missing route threads", () => {
    expect(
      resolveRouteThreadPresence({
        threadId: THREAD_ID,
        threads: [],
        draftThreadsByThreadId: {},
      }),
    ).toEqual({
      existsAsServerThread: false,
      existsAsDraftThread: false,
      routeThreadExists: false,
    });
  });
});
