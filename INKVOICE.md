# InkVoice

A local audiobook reader that converts epub books to speech using modern TTS models.

---

## Why This Exists

**The problem:** Most books don't have audiobook versions. Commercial audiobook services have limited catalogs, and existing TTS solutions are either cloud-dependent, have poor UX, or sound robotic.

**The solution:** InkVoice runs entirely locally, using state-of-the-art open-source TTS (Chatterbox) to generate natural-sounding speech from any epub. You control the UI, the voice, and your data never leaves your machine.

### Goals
- **Audiobook accessibility** - Listen to any book, not just those with commercial audio versions
- **Local-first** - No cloud dependencies, no subscriptions, no data harvesting
- **Reading along** - Follow the text while audio plays, with sentence-level synchronization
- **Voice control** - Use high-quality local TTS with future voice cloning support

---

## Current Status: MVP

### What Works
- [x] Library view - displays books from `data/books/` folder
- [x] Reader view - scroll-based text display with sentence highlighting
- [x] Play/Pause control with skip forward/back
- [x] Audio prefetching (3 sentences ahead for smooth playback)
- [x] Reading progress persistence (resumes where you left off)
- [x] Audio caching to disk (regeneration only happens once per sentence)
- [x] Light/dark mode (follows system preference)
- [x] Chapter navigation dropdown

### Not Yet Implemented
- [ ] Sentence highlighting during playback (text highlights but no sync animation)
- [x] Voice cloning - add `.wav` to `data/voices/`, set voice name in Player.tsx
- [x] Speed control (playback rate adjustment)
- [ ] Bookmarks
- [ ] Multiple voices for dialogue detection
- [ ] Electron packaging for distribution
- [ ] Mobile support

---

## Architecture

### Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 14 + TypeScript | Fast dev, good DX, SSR for epub parsing |
| Styling | Tailwind CSS | Rapid iteration, dark mode support |
| State | Zustand + persist middleware | Simple, works with SSR, localStorage sync |
| Epub parsing | epub.js | Browser-compatible, widely used |
| TTS | Chatterbox Turbo | Best open-source quality, runs on Apple Silicon |
| TTS API | FastAPI (Python) | Required for Chatterbox, simple to set up |

### Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Browser    │────▶│  Next.js API │────▶│  Python API │
│  (epub.js)  │     │  (caching)   │     │  (Chatterbox)│
└─────────────┘     └──────────────┘     └─────────────┘
      │                    │
      ▼                    ▼
 localStorage        ~/Library/Caches/
 (progress)          InkVoice/*.wav
```

1. **Library**: Next.js API reads `data/books/`, extracts epub metadata
2. **Reader**: epub.js parses book in browser, splits into sentences
3. **Playback**: Player component requests audio via `/api/tts`
4. **Caching**: Next.js API checks disk cache, calls Python only on miss
5. **Progress**: Zustand persists chapter/sentence to localStorage

### File Structure

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
│   └── books/                      # Drop .epub files here
├── scripts/
│   └── start.sh                    # Launch both servers
├── venv/                           # Python 3.11 environment
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

### Data Locations

| Data | Location | Persistence |
|------|----------|-------------|
| Source code | `~/Documents/reps/inkvoice/` | Git |
| Book files | `./data/books/*.epub` | Manual |
| Audio cache | `~/Library/Caches/InkVoice/{bookId}/` | Can be cleared |
| Reading progress | Browser localStorage | Per-browser |
| TTS model weights | `~/.cache/huggingface/` | Shared across apps |

---

## Development Log

### Session 1: Initial MVP Build

**Date:** 2025-02-01

**Decisions Made:**

1. **epub.js over server-side parsing**
   - Chose browser-based epub parsing for simplicity
   - Trade-off: Larger client bundle, but avoids file system complexity
   - Future: Could move to server-side for better performance

2. **Sentence-level audio, not paragraph**
   - Smaller chunks = faster initial playback
   - Easier to implement skip forward/back
   - Better for caching (smaller files, more granular)

3. **FastAPI wrapper for Chatterbox**
   - Chatterbox is Python-only, can't run in Node
   - Simple REST API: POST text → WAV bytes
   - Lazy model loading to avoid slow startup

4. **Zustand over React Context**
   - Built-in persist middleware for localStorage
   - Simpler than Redux, works with Next.js SSR
   - Only persist progress, not full book data

5. **Audio caching strategy**
   - Cache by `{bookId}/{chapter}_{sentence}.wav`
   - Check cache in Next.js API before calling Python
   - No expiration (user can clear ~/Library/Caches manually)

6. **No highlighting animation (MVP)**
   - Current sentence gets background highlight
   - Auto-scrolls to keep current sentence visible
   - Deferred: Word-level or smooth animation

**Technical Issues Resolved:**

- `next.config.ts` not supported in Next.js 14.2 → renamed to `.mjs`
- TypeScript picking up venv/node_modules → added to `exclude` in tsconfig
- Buffer type not assignable to NextResponse body → wrap in `Uint8Array`

**What's Working:**
- Full pipeline from epub → sentences → TTS → playback
- Progress saves and restores correctly
- Audio caching prevents regeneration
- Clean UI with system dark mode

---

## Running the App

### Prerequisites
- Node.js 18+
- Python 3.11 (via pyenv)
- pnpm

### Quick Start

```bash
cd ~/Documents/reps/inkvoice

# First time setup (already done):
# ~/.pyenv/versions/3.11.14/bin/python -m venv venv
# source venv/bin/activate && pip install -r api/requirements.txt
# pnpm install

# Run both servers:
./scripts/start.sh
```

Then:
1. Add `.epub` files to `data/books/`
2. Open http://localhost:3000
3. Click a book → reader opens
4. Press play → audio generates

### Manual Start (two terminals)

```bash
# Terminal 1: Python TTS API
cd ~/Documents/reps/inkvoice
source venv/bin/activate
cd api && uvicorn main:app --reload --port 8000

# Terminal 2: Next.js
cd ~/Documents/reps/inkvoice
pnpm dev
```

### Testing TTS Directly

```bash
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test."}' \
  --output test.wav

# Play it
afplay test.wav
```

---

## Roadmap

### Phase 2: Polish
- [ ] Loading states for book parsing
- [ ] Error recovery (retry failed TTS requests)
- [ ] Better sentence splitting (handle abbreviations, quotes)
- [ ] Cover image extraction from epub

### Phase 3: Enhanced Reading
- [ ] Word-level highlighting during playback
- [ ] Speed control (0.5x - 2x)
- [ ] Skip silence / pause between sentences
- [ ] Keyboard shortcuts (space = play/pause, arrows = skip)

### Phase 4: Voice Customization
- [ ] Migrate to Chatterbox-TTS-Server (https://github.com/devnen/Chatterbox-TTS-Server) for better long-form handling
- [x] Voice cloning with reference audio (`data/voices/*.wav`)
- [ ] Voice selector UI (currently hardcoded in Player.tsx)
- [ ] Per-book voice selection
- [ ] Dialogue detection (different voice for quotes)
- [ ] Multi-language TTS support (Russian via Silero, etc.)

### Phase 5: Distribution
- [ ] Electron wrapper for native app
- [ ] Drag-and-drop book import
- [ ] Library management (delete, organize)
- [ ] Export audio (full book as mp3)

---

## Notes

### Why Chatterbox?
- State-of-the-art open-source TTS quality
- Runs locally on Apple Silicon (MPS)
- Voice cloning capability for future use
- Active development

### Why Not...
- **Whisper + TTS**: Whisper is STT, not TTS
- **Coqui TTS**: Good but Chatterbox sounds better
- **ElevenLabs/OpenAI**: Cloud-only, costs money, privacy concerns
- **macOS say command**: Robotic, no customization

### Model Location
Chatterbox downloads to `~/.cache/huggingface/hub/models--ResembleAI--chatterbox/`
First run takes longer as it downloads ~1.5GB of model weights.

---

## Contributing

This is a personal project. The repo is at `~/Documents/reps/inkvoice/`.

Key files to understand:
- `src/lib/epub.ts` - How epubs are parsed
- `src/components/Player.tsx` - Audio playback logic
- `api/main.py` - TTS generation

---

*Last updated: 2025-02-01*
