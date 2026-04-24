# InkVoice

Local EPUB reader with voice generation support.

## Tech Stack

| Layer        | Technology                     |
| ------------ | ------------------------------ |
| Frontend     | Next.js 14 + TypeScript        |
| Styling      | Tailwind CSS                   |
| State        | Zustand + persist middleware   |
| Epub parsing | epub.js (browser-based)        |
| TTS          | OmniVoice via FastAPI (Python) |
| Desktop      | Electron (optional)            |

## Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+
- [portless](https://github.com/vercel-labs/portless) (global install): `npm install -g portless`

## Data Locations

| Data             | Location                          |
| ---------------- | --------------------------------- |
| User books       | `./data/books/*.epub`             |
| Starter books    | `./data/starter-books/*.epub`     |
| Voice references | `./data/voices/{name}/source.wav` |
| Reading progress | SQLite (`./data/inkvoice-dev.db`) |
| TTS cache        | `./data/cache/tts/*.opus`         |

## Scripts

| Command               | Purpose                          |
| --------------------- | -------------------------------- |
| `pnpm dev`            | Start Next.js + Python TTS API   |
| `pnpm ts`             | TypeScript type-check            |
| `pnpm lint`           | ESLint                           |
| `pnpm test`           | Vitest unit + integration suite  |
| `pnpm e2e`            | Playwright E2E suite             |
| `pnpm electron:build` | Build Electron desktop app       |
| `pnpm e2e:electron`   | E2E suite against Electron build |

## Desktop App

Electron packaging details are in `electron/` and `electron-builder.yml`. Build with `pnpm electron:build`; the resulting `.dmg` lands in `dist/`.

## Project Docs

- [`CLAUDE.md`](./CLAUDE.md) — design-system philosophy, component layering, conventions
- [`docs/pre-generation-design.md`](./docs/pre-generation-design.md) — TTS pre-generation architecture
