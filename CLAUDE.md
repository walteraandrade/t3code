# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Fork Scope Rule

This repo is a fork of t3code. Our fork is a **UI-only cover**. Only modify files in `apps/web/` — do NOT touch `apps/server/`, `apps/desktop/`, `packages/contracts/`, `packages/shared/`, `scripts/`, or any other non-web files. All changes must be purely presentational/UI.

## Commands

```bash
bun run dev              # full-stack dev (contracts + web + server)
bun run dev:server       # server only
bun run dev:web          # web only (Vite, port 5733)
bun run dev:desktop      # Electron + web

bun run build            # build all (Turbo)
bun run typecheck        # tsc --noEmit across all packages
bun run lint             # oxlint
bun run fmt              # oxfmt (write)
bun run fmt:check        # oxfmt (check only)

bun run test             # Vitest (NEVER use `bun test`)
bun run test:browser     # Playwright browser tests (web)
```

All of `bun run fmt`, `bun run lint`, and `bun run typecheck` must pass before considering tasks completed.

## Architecture

Monorepo (Bun workspaces + Turbo). Requires `bun@1.3.9`, `node@^24.13.1`.

### Package Roles

- **`apps/server`** — Node.js WebSocket/HTTP server. Wraps Codex app-server (JSON-RPC over stdio), manages provider sessions, serves built web app. Uses **Effect.ts** for services, error handling, and dependency injection.
- **`apps/web`** — React 19 / Vite 8 UI. State in **Zustand** (persisted to localStorage). Routing via **TanStack Router** (file-based). Styling with **TailwindCSS v4**. Rich editor via **Lexical**, terminal via **xterm.js**.
- **`apps/desktop`** — Electron wrapper.
- **`packages/contracts`** — Shared Effect/Schema schemas and TS contracts. **Schema-only, no runtime logic.**
- **`packages/shared`** — Shared runtime utilities. Uses explicit subpath exports (`@t3tools/shared/git`) — **no barrel index**.

### Data Flow

```
Codex/Claude Agent (stdio) → Server (Effect services, orchestration engine)
  → WebSocket push → Browser (Zustand store) → React components
```

- Server starts `codex app-server` per session, streams events to browser via WebSocket.
- Web consumes orchestration domain events on channel `orchestration.domainEvent`.
- Key server files: `codexAppServerManager.ts` (session lifecycle), `providerManager.ts` (provider dispatch), `wsServer.ts` (WebSocket routing).

### Key Patterns

- **Effect.ts** on server: service layers, functional error handling, dependency injection via layers.
- **Zustand** on web: pure state transition functions, immutable updates, debounced localStorage persistence.
- **TanStack Router**: file-based routes in `apps/web/src/routes/`. `_` prefix = layout nesting. `routeTree.gen.ts` is auto-generated (ignored by linters).
- **React Compiler** enabled via Vite plugin — avoid manual memoization.

## Code Priorities

1. Performance first.
2. Reliability first.
3. Predictable behavior under load and failures (reconnects, partial streams, session restarts).

Choose correctness and robustness over short-term convenience.

## Maintainability

- Extract shared logic to separate modules; don't duplicate across files.
- Check if logic belongs in `packages/shared` before adding local helpers.
- Don't take shortcuts — improve long-term code quality.
- Proposing sweeping changes that improve maintainability is encouraged (early WIP project).

## Tooling

- **Linting**: oxlint (plugins: eslint, oxc, react, unicorn, typescript). Categories: correctness, suspicious, perf as warnings.
- **Formatting**: oxfmt (Rust-based). Config in `.oxfmtrc.json`.
- **TypeScript**: strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Effect language service plugin in all packages.
- **Testing**: Vitest 4. Tests colocated with source (`.test.ts`). Browser tests in `*.browser.tsx` (Playwright + Chromium). Server test timeout: 15s, browser: 30s.
- **Build**: Turbo orchestrates. Vite for web, tsdown for server/packages.

## Reference

- Codex App Server docs: https://developers.openai.com/codex/sdk/#app-server
- Codex repo: https://github.com/openai/codex
- CodexMonitor (Tauri reference impl): https://github.com/Dimillian/CodexMonitor
