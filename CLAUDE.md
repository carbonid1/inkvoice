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

## File Structure

```
inkvoice/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, global styles
│   │   ├── page.tsx                # Library view (home)
│   │   ├── globals.css             # Tailwind imports + theme
│   │   ├── book/[id]/
│   │   │   └── page.tsx            # Reader view
│   │   └── api/
│   │       ├── books/route.ts      # GET: list all books
│   │       ├── book/[id]/route.ts  # GET: parse single book
│   │       └── tts/route.ts        # POST: generate/cache audio
│   ├── components/
│   │   ├── BookCard.tsx            # Book thumbnail in library
│   │   ├── Reader.tsx              # Sentence display + scrolling
│   │   └── Player.tsx              # Playback controls + buffer
│   ├── lib/
│   │   ├── epub.ts                 # Parse epub → chapters → sentences
│   │   ├── cache.ts                # Disk cache read/write
│   │   └── paths.ts                # BOOKS_DIR, CACHE_DIR constants
│   └── store/
│       └── useStore.ts             # Zustand: books, progress, actions
├── api/
│   ├── main.py                     # FastAPI + Chatterbox TTS
│   └── requirements.txt            # Python dependencies
├── data/
│   ├── books/                      # Drop .epub files here
│   └── voices/                     # Voice cloning references
└── scripts/
    └── start.sh                    # Launch both servers
```

## Key Files

- `src/lib/epub.ts` - Epub parsing logic
- `src/components/Player.tsx` - Audio playback and prefetching
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
