# InkVoice

Local EPUB reader that turns your books into audiobooks. Narration is generated on-device with neural TTS — no cloud, no accounts, no data leaving your Mac.

![InkVoice library](docs/screenshots/library.png)

## Download

Grab the `.dmg` from the [latest release](https://github.com/carbonid1/inkvoice/releases/latest). Requires an Apple Silicon Mac.

The app is unsigned, so macOS blocks the first launch:

1. Open the app and dismiss the warning.
2. Go to **System Settings → Privacy & Security**, scroll down, and click **Open Anyway**.

(On macOS 15+ the old right-click → Open trick no longer works — the settings route is the only way.)

First launch downloads the TTS model (~1.6 GB) into `~/.cache/huggingface/`. Your books, generated audio, and settings live in `~/Library/Application Support/InkVoice/`.

## Features

- **EPUB library** — add your own books, or start reading with the bundled public-domain classics
- **On-device narration** — natural-sounding speech generated locally with OmniVoice TTS
- **11 voices included** — and you can add your own from a ~10-second reference recording
- **Pregeneration** — synthesize a whole book's audio ahead of time, within a storage budget you control
- **Reading progress and bookmarks** — pick up where you left off, in text or audio

|                        Reader                         |                    Generation queue                     |
| :---------------------------------------------------: | :-----------------------------------------------------: |
| ![Reader with narration](docs/screenshots/reader.png) | ![Pregeneration queue](docs/screenshots/generation.png) |

|                        Dark mode                         |                       Voices & storage                       |
| :------------------------------------------------------: | :----------------------------------------------------------: |
| ![Reader in dark mode](docs/screenshots/reader-dark.png) | ![Voice and storage settings](docs/screenshots/settings.png) |

## Development

Prereqs: Node 22+, pnpm 11 (pinned via `packageManager`), Python 3.11.

```bash
pnpm install
python3.11 -m venv venv && source venv/bin/activate && pip install -r api/requirements.txt
pnpm dev
```

`pnpm dev` runs database migrations, starts the app at `http://localhost:49813`, and lazy-spawns the Python TTS server on demand.

| Command               | Purpose                      |
| --------------------- | ---------------------------- |
| `pnpm ts`             | TypeScript type-check        |
| `pnpm lint`           | ESLint                       |
| `pnpm test`           | Vitest                       |
| `pnpm e2e`            | Playwright E2E               |
| `pnpm electron:build` | Desktop app (.dmg → `dist/`) |

The desktop build downloads its own Node.js and Python runtimes on the first run and caches them (`dist-node/`, `dist-python/`); subsequent builds are much faster.

## Credits

Bundled voice references (`data/voices/`) are derived from the [Hi-Fi Multi-Speaker English TTS Dataset](http://openslr.org/109/) (Bakhturina et al., 2021), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); audio clips were trimmed and processed for use as TTS voice references. Additional credit to the [LJ Speech Dataset](https://keithito.com/LJ-Speech-Dataset/) by Keith Ito.

## License

[MIT](LICENSE) — covers the code. Bundled voice data is CC BY 4.0 as noted above.
