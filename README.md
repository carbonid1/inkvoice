# InkVoice

Local EPUB reader with TTS voice generation.

## Run

Prereqs: Node 20+, pnpm 9+, Python 3.11+, [portless](https://github.com/vercel-labs/portless) (`npm i -g portless`).

```bash
pnpm install
pnpm dev
```

Drop `.epub` files into `./data/books/`.

## Scripts

| Command               | Purpose                      |
| --------------------- | ---------------------------- |
| `pnpm ts`             | TypeScript type-check        |
| `pnpm lint`           | ESLint                       |
| `pnpm test`           | Vitest                       |
| `pnpm e2e`            | Playwright E2E               |
| `pnpm electron:build` | Desktop app (.dmg → `dist/`) |
