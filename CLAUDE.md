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
