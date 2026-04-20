# Workflow

## Log Hygiene

Dev server logs should contain **only application-level information**: HTTP requests, generation progress, real errors. A new warning in the logs should mean something broke — not that a library author deprecated an internal API.

**Decision framework:**

- **Actionable warning** (our code triggers it) → fix the root cause
- **Non-actionable warning** (library internals, deprecation notices we can't act on) → suppress it and document why in a code comment
- **Real errors** → never suppress; fix or surface clearly

**When to act:** If you encounter log noise during any task, suppress it immediately as part of the current work. Don't defer to a ticket or ask — clean it up in place. The cost of leaving noise is cumulative: it trains everyone to ignore logs, which hides real issues.

**Suppression rules:**

- Python warnings: `warnings.filterwarnings("ignore", ...)` with the narrowest filter that works (by category, message, or module)
- Python logging: `logging.getLogger("library").setLevel(logging.ERROR)` — set at the point where the library configures its logger, not at module top level (libraries may reset levels during import)
- Node: only `console.warn` and `console.error` pass the linter — use `console.warn` for expected operational events (warmup, retry), `console.error` for failures

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- List skills to load during implementation (e.g., `tdd`). Plans lose skill context — explicitly naming them ensures they get activated.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

### UI/UX Planning

Every plan must evaluate whether the task involves UI/UX decisions — new components, layout changes, interaction patterns, visual design, or anything user-facing that isn't purely mechanical.

**When UI/UX review is needed** — load `ui-ux-pro-max` in the skills list. Use the skill before implementing to get design guidance on structure, patterns, and polish.

**When UI/UX review isn't needed** — state "No UI/UX review needed — [reason]" so the omission is intentional. Examples: pure backend logic, config changes, refactors with no visual impact.

### Test-Driven Planning

Every plan must evaluate whether tests are needed and state the decision explicitly.

**When tests aren't needed** — skip the testing section for:

- Pure config/env changes
- Style-only tweaks with no logic
- Generated file updates

State "No tests needed — [reason]" so the omission is intentional, not forgotten. Do NOT include `tdd` in the skills list.

**When tests are needed** — everything else. Include a **Testing** section before implementation steps:

1. Identify testable behaviors — what does the user/caller observe? Not implementation steps, but outcomes.
2. Choose the test layer for each behavior:
   - Storybook (`*.stories.tsx`) — React components (visual rendering, interaction, variants)
   - Vitest (`*.test.ts`) — non-visual logic (hooks, helpers, services, transformations)
   - Playwright E2E (`tests/e2e/*.spec.ts`) — cross-page flows, browser-native behavior
3. List behaviors as test cases — verb-first descriptions (e.g., "displays error when amount exceeds balance", "disables submit while loading")
4. Include `tdd` in the skills list

Implementation order follows TDD: interleave tests with implementation steps, not all tests at the end.

## Verification

- Run `pnpm ts` after meaningful changes
- Run `pnpm test` for related files only
- Before considering a feature done, run the full check: `pnpm ts`, `pnpm lint`, `pnpm test`, and `pnpm e2e`
- For Electron changes (`electron/`, `electron-builder.yml`, `scripts/build-*`): rebuild with `pnpm electron:build`, then run `pnpm e2e:electron`

## Git

- Never commit or push without explicit user request
