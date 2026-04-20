# Code Style

## Naming

- Use full words in UI text, debug output, and code identifiers — no abbreviations (e.g., "Sentence" not "Pos", "Chapter" not "Ch")

## Syntax

- Prefer named type aliases over inline type annotations — extract object types, union types, and function signatures into named `type` declarations

  ```typescript
  // Preferred
  type Props = {
    title: string
    onClick: () => void
  }
  const Button = ({ title, onClick }: Props) => { ... }

  // Avoid
  const Button = ({ title, onClick }: { title: string; onClick: () => void }) => { ... }
  ```

- When `let` is unavoidable, use `.reduce()`, `.slice()`, spread, or closure patterns instead of mutable accumulators; wrap related mutable state in a `const` object rather than separate `let` variables.

## Keyboard Shortcuts

- Use `react-hotkeys-hook` for keyboard shortcuts

## Custom Hooks

- Extract non-trivial logic (timers, subscriptions, derived state) into dedicated hooks
- Add lightweight smoke tests — cover the happy path and key edge cases, don't exhaustively test every branch
- Inline hooks are fine for simple one-liner wrappers

## Zustand Persist Migrations

- Migrations must preserve existing user state — never discard previously stored values when adding new fields

## React Referential Stability

- **Zustand selectors**: `useStore((s) => s.x)` not `const { x } = useStore()` — destructuring subscribes to all state
- **`useMemo` on hook returns**: Any hook returning `{ ...values, ...callbacks }` must wrap in `useMemo` to prevent infinite loops if consumers dep-array the result
- **Effect cleanup + ref reset**: Any effect cleanup that mutates refs must have matching setup that resets them (StrictMode double-mounts reuse stale ref values)
- **Test callback stability**: Write one per exported callback on hooks that return functions
  ```ts
  const { result, rerender } = renderHook(() => useMyHook())
  const first = result.current.callback
  rerender()
  expect(result.current.callback).toBe(first)
  ```
