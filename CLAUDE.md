# InkVoice

Local audiobook reader that converts epub books to speech using Chatterbox TTS.

## Tech Stack

| Layer        | Technology                      |
| ------------ | ------------------------------- |
| Frontend     | Next.js 14 + TypeScript         |
| Styling      | Tailwind CSS                    |
| State        | Zustand + persist middleware    |
| Epub parsing | epub.js (browser-based)         |
| TTS          | Chatterbox via FastAPI (Python) |

## Key Files

- `src/lib/epub/epub.ts` - Epub parsing logic
- `src/components/player/PlayerContainer.tsx` - Audio playback and prefetching
- `api/main.py` - TTS generation endpoint

## Data Locations

| Data              | Location                              |
| ----------------- | ------------------------------------- |
| Book files        | `./data/books/*.epub`                 |
| Voice references  | `./data/voices/{name}/source.wav`     |
| Audio cache       | `~/Library/Caches/InkVoice/{bookId}/` |
| Reading progress  | Browser localStorage                  |
| TTS model weights | `~/.cache/huggingface/`               |

## Running the App

```bash
pnpm dev
```

This runs `./scripts/start.sh` which launches both the Python TTS API (:8000) and Next.js (:3000). Always use `pnpm dev` — never start servers individually.

Then add `.epub` files to `data/books/` and open http://localhost:3000

## Testing TTS

```bash
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test."}' \
  --output test.wav && afplay test.wav
```

## Log Hygiene

- Keep dev server logs **free of warnings and errors** — clean logs make regressions immediately visible
- Fix or suppress upstream warnings (e.g., pad voice files to 40ms boundaries for Chatterbox mel alignment)
- Never swallow errors silently; if suppressing a warning, document why

## Development Notes

- Use `react-hotkeys-hook` for keyboard shortcuts.

### React Referential Stability

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

## Naming and Labels

- Use full words in UI text, debug output, and code identifiers — no abbreviations (e.g., "Sentence" not "Pos", "Chapter" not "Ch")

## Code Style

- Use `const` with arrow functions instead of `function` declarations:

  ```typescript
  // Preferred
  const handleClick = () => { ... }

  // Avoid
  function handleClick() { ... }
  ```

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

- Prefer `const` over `let` — use `let` only when reassignment is unavoidable
  - Use `.reduce()`, `.slice()`, spread, or closure patterns instead of mutable accumulators
  - Wrap related mutable state in a `const` object rather than separate `let` variables

## Documentation

- Sacrifice grammar for concision

## Plan Mode

- Make plans extremely concise
- End with unresolved questions, if any

## Verification

- Run `pnpm ts` after meaningful changes
- Run `pnpm test` for related files only

## Git

- Never commit or push without explicit user request
