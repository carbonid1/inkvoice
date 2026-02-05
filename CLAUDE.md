# InkVoice

Local audiobook reader that converts epub books to speech using Chatterbox TTS.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand + persist middleware |
| Epub parsing | epub.js (browser-based) |
| TTS | Chatterbox via FastAPI (Python) |

## Key Files

- `src/lib/epub/epub.ts` - Epub parsing logic
- `src/components/player/PlayerContainer.tsx` - Audio playback and prefetching
- `api/main.py` - TTS generation endpoint

## Data Locations

| Data | Location |
|------|----------|
| Book files | `./data/books/*.epub` |
| Voice references | `./data/voices/{name}/source.wav` |
| Audio cache | `~/Library/Caches/InkVoice/{bookId}/` |
| Reading progress | Browser localStorage |
| TTS model weights | `~/.cache/huggingface/` |

## Running the App

```bash
# Run both servers:
./scripts/start.sh

# Or manually (two terminals):

# Terminal 1: Python TTS API
source venv/bin/activate
cd api && uvicorn main:app --reload --port 8000

# Terminal 2: Next.js
pnpm dev
```

Then add `.epub` files to `data/books/` and open http://localhost:3000

## Testing TTS

```bash
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test."}' \
  --output test.wav && afplay test.wav
```

## Development Notes

- Use `react-hotkeys-hook` for keyboard shortcuts.

## Code Style

- Use `const` with arrow functions instead of `function` declarations:
  ```typescript
  // Preferred
  const handleClick = () => { ... }

  // Avoid
  function handleClick() { ... }
  ```
- Prefer `const` over `let` — use `let` only when reassignment is unavoidable
  - Use `.reduce()`, `.slice()`, spread, or closure patterns instead of mutable accumulators
  - Wrap related mutable state in a `const` object rather than separate `let` variables

## Testing

- Tests are optional - consider pragmatically
- Skip tests when TypeScript already validates the logic
- Test complex logic, edge cases, and transformations

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

## Adding New Voices

Voices are stored in `data/voices/` with the following structure:

```
data/voices/
  voice-name/
    source.wav   # Reference audio for TTS cloning (required)
    sample.wav   # TTS-generated preview clip (optional)
```

To add a new voice:

1. Create a directory: `data/voices/{voice-name}/`
2. Add `source.wav` - the reference audio file for voice cloning (must be at least 5 seconds)
3. Generate `sample.wav` using the TTS API (see below)

### Generating Voice Samples

Use the standard sample text (Night's Watch Oath) for consistency:

> "Night gathers, and now my watch begins. It shall not end until my death. I shall take no wife, hold no lands, father no children. I shall wear no crowns and win no glory. I shall live and die at my post. I am the sword in the darkness. I am the watcher on the walls. I am the shield that guards the realms of men."

Generate a sample using curl:

```bash
curl -X POST "http://localhost:8880/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Night gathers, and now my watch begins. It shall not end until my death. I shall take no wife, hold no lands, father no children. I shall wear no crowns and win no glory. I shall live and die at my post. I am the sword in the darkness. I am the watcher on the walls. I am the shield that guards the realms of men.",
    "voice": "voice-name"
  }' \
  --output data/voices/voice-name/sample.wav
```

Replace `voice-name` with the actual voice directory name.
