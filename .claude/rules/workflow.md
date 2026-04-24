# Workflow

## Verification by Layer

- **UI**: exercise via `agent-browser` before calling done
- **Backend / API**: `curl` + log-tail
- **Timing-sensitive bugs** (races, workers, background state): document the live repro recipe in the commit message

## Log Hygiene

Dev logs should be app-level info only. Actionable warnings → fix root cause. Non-actionable library noise → suppress with the narrowest filter (by category/module) and a comment on why. Never suppress real errors. Clean up log noise in place during the current task — don't defer.

- Python warnings: `warnings.filterwarnings("ignore", ...)` narrowly
- Python logging: `logging.getLogger("library").setLevel(logging.ERROR)` at the library's init point, not module top
- Node: `console.warn` for expected operational events, `console.error` for failures

## Plan Mode

- Concise; sacrifice grammar for density
- List skills to load (e.g. `tdd`, `ui-ux-pro-max`) — skills don't survive plan mode without explicit mention
- End with unresolved questions

**UI/UX work** → load `ui-ux-pro-max`. Non-UI → state "No UI/UX review needed — [reason]".

**Tests**: include a Testing section listing behaviors (verb-first) and their layer (Storybook for React components, Vitest for logic, Playwright for cross-page flows). Load `tdd` skill. Skip only for pure config/style/generated changes, stating why.

## Verification Commands

Full check before done: `pnpm ts && pnpm lint && pnpm test && pnpm e2e`. Electron changes: `pnpm electron:build` then `pnpm e2e:electron`.

## Git

Never commit or push without explicit user request.
