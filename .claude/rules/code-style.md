# Code Style

- **Full words** in UI text, debug output, and identifiers — no abbreviations (e.g. `Sentence`, not `Pos`).
- **Named type aliases** over inline annotations:
  ```ts
  type Props = { title: string; onClick: () => void }
  const Button = ({ title, onClick }: Props) => { ... }
  ```
- When `let` is unavoidable, prefer `.reduce` / `.slice` / spread / closures. Group related mutable state in a single `const` object, not separate `let` vars.
- **Zustand persist migrations** must preserve existing user state — never discard stored values when adding fields.

## React Referential Stability

- **Zustand selectors**: `useStore((s) => s.x)` — never destructure the whole store.
- Hooks returning `{ ...values, ...callbacks }` must wrap the return in `useMemo` to prevent consumer-side infinite loops.
- Test callback stability on hooks that return functions:
  ```ts
  const { result, rerender } = renderHook(() => useMyHook())
  const first = result.current.callback
  rerender()
  expect(result.current.callback).toBe(first)
  ```
