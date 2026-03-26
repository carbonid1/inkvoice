# InkVoice

Local audiobook reader that converts epub books to speech using Chatterbox TTS.

## Design System Philosophy

The goal is zero raw HTML in feature code. Every UI element — interactive (buttons, inputs, selects) and presentational (cards, badges, layout containers, typography) — should come from `src/components/ui/`.

**Before writing a native tag:** Check if a design system component exists in `src/components/ui/`. If it does, use it. If it almost fits, extend it. Only use a native tag as a last resort for truly one-off edge cases — and flag it as a candidate for a future component.

**Component layering:**
- `src/components/ui/` — Design system (Button, Select, Tooltip, etc.). Reusable across any app with just a theme swap.
- `src/components/` — App-level components (VoiceSelect, PageHeader). Built on `ui/` primitives, tied to InkVoice's domain.

This is aspirational — not everything is migrated yet. Each new component or refactor should move closer to this goal.

## Tech Stack

| Layer        | Technology                      |
| ------------ | ------------------------------- |
| Frontend     | Next.js 14 + TypeScript         |
| Styling      | Tailwind CSS                    |
| State        | Zustand + persist middleware    |
| Epub parsing | epub.js (browser-based)         |
| TTS          | Chatterbox via FastAPI (Python) |

## Data Locations

| Data             | Location                          |
| ---------------- | --------------------------------- |
| Book files       | `./data/books/*.epub`             |
| Voice references | `./data/voices/{name}/source.wav` |
| Reading progress | Browser localStorage              |

## Running the App

```bash
pnpm dev
```

This runs `./scripts/start.sh` which launches both the Python TTS API (:8000) and Next.js (:3000). Always use `pnpm dev` — never start servers individually.

Then add `.epub` files to `data/books/` and open http://localhost:3000
