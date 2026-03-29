# Fork maintenance strategy

This document defines how this fork stays current with
`pingdotgg/t3code` without letting upstream syncs repeatedly overwrite
fork-specific design decisions.

## Summary

This fork uses a theme-shell strategy.

- Keep a normal fork and sync `upstream/main` regularly.
- Keep fork identity in `apps/web/src/fork/**`.
- Treat upstream code as upstream-owned by default.
- Use merge-based upstream sync branches.
- Keep upstream sync work separate from feature work.

## Fork-owned surface area

Fork-specific changes belong in `apps/web/src/fork/**` when they affect:

- branding
- design tokens
- layout shells
- visual presentation
- fork-only UX polish that does not change core runtime behavior

Shared app code remains the place for:

- correctness fixes
- performance work
- resilience and reconnect handling
- provider and orchestration behavior
- generic reusable primitives

## Upstream sync workflow

Use this workflow for every upstream adoption cycle.

1. Run `git fetch upstream origin`.
2. Update `upstream-sync` from `upstream/main`.
3. Create `sync/<date>` from `main`.
4. Merge `upstream-sync` into `sync/<date>`.
5. Resolve conflicts by preserving fork seams in `apps/web/src/fork/**`
   and adapting shared interfaces only where necessary.
6. Run `bun fmt`.
7. Run `bun lint`.
8. Run `bun typecheck`.
9. Merge the sync branch into `main`.

Prefer small, regular syncs over large catch-up merges.

## Pull request guardrails

Apply these rules to every future branch and PR.

1. Put visual identity changes in `apps/web/src/fork/**`.
2. Do not edit upstream-owned files for cosmetic changes when a token,
   wrapper, or shell can express the change.
3. Keep upstream sync PRs separate from feature PRs.
4. Explain any new long-lived divergence in the PR description.
5. If a fork-specific conditional appears in shared code, justify why a
   seam in `fork/**` was not sufficient.

## Current seam map

The current fork seam lives primarily in these files:

- `apps/web/src/fork/brand/config.ts`
- `apps/web/src/fork/theme/tokens.css`
- `apps/web/src/fork/theme/semantic.css`
- `apps/web/src/fork/layout/AppShell.tsx`
- `apps/web/src/fork/layout/ChatShell.tsx`
- `apps/web/src/fork/components/ForkSidebarHeader.tsx`

When upstream UI changes land, adapt these files first before editing
shared components.
