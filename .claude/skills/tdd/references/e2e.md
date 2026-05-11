# E2E Tests

## When This Gets Used

E2E candidates are identified during **planning** (step 1), not after implementation. The decision funnel below runs upfront — by the time you're writing code, you already know which behaviors get E2E and which don't. Execution happens in step 5, after the unit TDD loop.

Most features do NOT need E2E. The funnel filters aggressively — this is intentional. Every E2E test is a maintenance commitment: slower to run, harder to debug, more fragile than a unit test. Only write one when the confidence gap between "unit tests pass" and "this actually works" is real.

## Decision Funnel

Work through these steps in order. Stop at the first "no."

### 1. Is this E2E-shaped?

The feature qualifies if it involves at least one of:

- **Cross-page state**: User action on page A affects what they see on page B (e.g., selecting a voice in settings → book page reflects it)
- **Browser-native behavior**: Relies on real browser APIs that jsdom doesn't faithfully simulate — audio playback, IntersectionObserver, CSS transitions, focus management, `beforeunload`
- **Multi-step user flows**: The value is in the _sequence_, not any single step. "Play → navigate away → prefetch stops" can't be captured in a unit test because the lifecycle spans route changes
- **Keyboard shortcuts affecting cross-component UI**: A keypress triggers state changes visible in a different part of the page (e.g., Shift+B opens a drawer that shows data from the player bar)

If none apply → unit tests are sufficient, stop here.

### 2. Already covered?

**Read `tests/e2e/*.spec.ts` before deciding.** Check whether the behavior is already exercised by an existing test, even indirectly. A test that navigates to a book and clicks play already verifies the book page loads, the player bar renders, and TTS kicks off — even if that wasn't its primary purpose.

If fully covered → stop. If partially covered → consider extending. If not covered → continue.

### 3. Extend or new spec?

Default to **extending** an existing spec. A new spec file costs setup overhead, a new CI test group, and a new thing to maintain. Extending costs one `test()` block.

**Extend when:**

- Same page as existing spec
- Same preconditions (same mocks, same navigation)
- Related behavior (bookmarks drawer + bookmark shortcut = same spec)
- Existing spec stays focused (not a grab-bag of unrelated tests)

**New spec when:**

- Different page or different starting point
- Completely unrelated feature
- Existing spec already has 5+ tests and adding more would obscure its purpose

### 4. Is it practical?

Three filters, all must pass:

**Mock budget**: Can we mock what we need using existing helpers (`mockTTS`, `mockBookmarks`, `navigateToBook`)? If the feature needs ≤ 1 new `page.route()` mock, that's fine. If it needs 3+ new mocks or requires mocking complex state, the test scope is probably too wide — break it down or rely on unit tests.

**Determinism**: No timing dependencies. Replace `waitForTimeout` with `waitForSelector`, `expect.poll()`, or `expect().toBeVisible()`. If the behavior inherently depends on timing (animation completion, debounce settling), it's a poor E2E candidate.

**Speed**: Individual test should complete in under 10 seconds. The full E2E suite should stay under 60 seconds. If a test is slow, it probably has unnecessary navigation or setup — use helpers to shortcut.

If any filter fails → reconsider. Partial unit coverage may be the better tradeoff.

### 5. Write it

Only at this point. One test per user journey. Keep it focused.

## Spec Structure

Every spec file has two levels of documentation in product language (what the user experiences, not what the test clicks):

**`test.describe` block comment** — describes the product capability this spec covers. Helps decide whether a new test belongs here or in a separate spec.

```typescript
/**
 * Bookmarking lets readers save and return to specific paragraphs.
 * Bookmarks persist per book and are accessible through a slide-out drawer.
 */
test.describe('bookmarks', () => {
```

**`test()` single-line JSDoc** — describes the specific user scenario. The test name carries most of the meaning; the comment adds the "why it matters" or clarifies what isn't obvious from the name.

```typescript
  /** Removing a bookmark from the drawer hides it and offers an undo action. */
  test('removing bookmark from drawer shows undo toast', async ({ page }) => {
```

## Running E2E Tests

### Web E2E (primary)

- Location: `tests/e2e/`
- Run: `pnpm e2e` (headless) or `pnpm e2e:ui` (interactive)
- Config: `playwright.config.ts`
- Only Chromium — keep it fast
- Tests the web UI against Next.js dev server with mocked APIs

### Electron Smoke Tests

- Location: `tests/electron/`
- Run: `pnpm e2e:electron`
- Config: `playwright.electron.config.ts`
- Prerequisite: packaged app must exist (`pnpm electron:build`). Skips gracefully if not found.
- Tests the real production flow: app launch, loading screen, server startup, UI loads, basic navigation
- Run only when Electron-related code changes (`electron/`, `electron-builder.yml`, `scripts/build-*`) — not on every feature
- These do NOT replace web E2E. Web E2E tests the UI layer. Electron smoke tests verify the shell works.

## Debugging Failed E2E Tests

When a test fails, analyze the trace before touching code. Don't guess from the error message.

### Step 1: Post-mortem trace analysis (first resort)

The project uses `trace: 'on-first-retry'` with `retries: 0`, so traces aren't recorded by default. Re-run the failing test with `--trace on` to capture one:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test path/to/test.spec.ts --trace on
```

Then analyze from the CLI:

```bash
# List all actions in the trace
npx playwright trace open test-results/<test-folder>/trace.zip
npx playwright trace actions

# Filter actions to find the failing area
npx playwright trace actions --grep="click"

# Inspect a specific action (timing, error, page state)
npx playwright trace action 5

# View DOM snapshots before/after that action
npx playwright trace snapshot 5 --name before
npx playwright trace snapshot 5 --name after

# Close the trace session when done
npx playwright trace close
```

### Step 2: CLI debugger (when traces aren't enough)

Re-run the failing test with `--debug=cli` to step through it live. Run in background so the CLI debugger can attach to the same process:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test path/to/test.spec.ts --debug=cli
```

Wait for "Debugging Instructions" with a session name, then attach:

```bash
npx playwright-cli attach tw-<session-id>

# Step through test execution
npx playwright-cli step-over

# Inspect current page state
npx playwright-cli snapshot
npx playwright-cli console
npx playwright-cli network
```

Every action generates corresponding TypeScript code — copy it directly into the test when fixing locators or assertions.

### Workflow

1. Test fails → re-run with `--trace on`
2. `trace actions` → scan for the failing action
3. `trace action N` + `trace snapshot N` → see what happened
4. Fix with evidence, not guesses
5. If still unclear → re-run with `--debug=cli` and step through

### Tool choice

- **`npx playwright-cli`** — debugging Playwright test runs: stepping through specs, inspecting traces, generating locators from test context
- **`agent-browser`** — anything outside a Playwright test: visiting live URLs, manual smoke checks, scraping, non-test browser tasks

## Keeping Playwright CLI Skills Updated

The `playwright-cli` skill (`.claude/skills/playwright-cli/`) is bundled with `@playwright/cli`, which has its own release cycle independent of `@playwright/test`. After upgrading `@playwright/test`, also update the CLI to stay in sync, then reinstall skills:

```bash
pnpm update @playwright/cli
npx playwright-cli install --skills
```

## Available Helpers

All live in `tests/e2e/helpers/`. Read them before writing to understand the exact API.

| Helper                 | What it does                                                          | When to use                                        |
| ---------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| `mockTTS(page)`        | Intercepts `/api/tts/**`, returns silence.wav with mock cache headers | Almost every test — book pages trigger TTS on load |
| `mockBookmarks(page)`  | In-memory CRUD for `/api/bookmarks/**`                                | Tests involving bookmark create/read/delete        |
| `navigateToBook(page)` | Library → first book, waits for header                                | Any test that needs to be on a book page           |

**Writing new helpers**: If your new E2E test needs a mock that would be useful across multiple specs, extract it into `helpers/`. One mock per file. Follow the existing pattern: accept `Page`, call `page.route()`, return nothing.

## Patterns

**Semantic selectors over CSS classes.** Prefer `getByRole('button', { name: 'Play' })` over `.play-button`. Semantic selectors survive style refactors. CSS class selectors are acceptable for layout containers with no semantic role (e.g., `.fixed.bottom-0` for the player bar). Never use Tailwind utility classes (e.g., `.bg-amber-200\/70`) as element identifiers — add a `data-*` attribute instead.

**`expect.poll()` for async conditions.** When waiting for something that will happen but you don't know when (like TTS requests starting), use `expect.poll()` instead of `waitForTimeout`. It retries until the assertion passes or times out.

```typescript
// good — deterministic
await expect.poll(() => ttsRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)

// bad — timing-dependent, flaky
await page.waitForTimeout(2000)
expect(ttsRequests.length).toBeGreaterThan(0)
```

**Request tracking via `page.on('request')`.** For asserting that API calls were (or weren't) made, attach a listener before the action:

```typescript
const requests: string[] = []
page.on('request', req => {
  if (req.url().includes('/api/tts/')) requests.push(req.url())
})
```

**One journey per test.** Each `test()` block should tell one story: "user does X, sees Y." If you're testing two independent behaviors, write two tests even if they share setup.

## Anti-Patterns

**`waitForTimeout` for assertions.** Flaky — passes in fast environments, fails in slow ones. The existing `prefetch.spec.ts` uses this in two places and it's a known weakness.

**Asserting on CSS class names for behavior.** `toHaveClass(/translate-x-0/)` is testing the animation implementation, not the behavior. Prefer `toBeVisible()` when possible. (The bookmarks spec does this — acceptable because Playwright can't "see" off-screen translated elements, but it's a compromise.)

**Tailwind utility classes as element locators.** `page.locator('span.bg-amber-200\\/70')` breaks when colors or styles change. Use a semantic data attribute instead (e.g., `[data-active-sentence]`). Tailwind classes describe _how_ something looks, not _what_ it is — tests should target identity, not appearance.

**Testing component internals through DOM queries.** If you're digging into nested DOM structure to verify state, that's a unit test in disguise. E2E tests should verify what the user sees and can interact with.

**Multiple unrelated features in one test.** A test that adds a bookmark AND changes the voice AND checks the pronunciation panel is three tests pretending to be one. It's hard to debug when it fails and unclear what it's actually verifying.
