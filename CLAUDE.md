# InkVoice

Dev Next.js runs on `http://localhost:49813`.

## Design System (Aspirational)

Zero raw HTML in feature code. Use `src/components/ui/` first; extend when close; native tag only as last resort and flag it as a future component.

- `src/components/ui/` — design-system primitives, theme-swappable
- `src/components/` — app components built on `ui/`, tied to InkVoice's domain

Colors use semantic CSS tokens in `globals.css`, never hardcoded Tailwind color classes.

Current state is partially migrated — each change moves closer to the goal.

## Storybook / MCP

`pnpm storybook:all` starts both Storybooks in the right order — InkVoice (7007) composes `@carbonid1/design-system` (7006, from the separate `packages` repo), and the single `inkvoice-storybook` MCP (`localhost:7007/mcp`) serves both. (`pnpm storybook` runs InkVoice alone.) Before using a design-system component, query that MCP (`list-all-documentation`, then `get-documentation` with `storybookId: 'design-system'`) — never invent its props.

## Resource Limits

Never disable memory caps, allocator watermarks, or other OS/framework safety limits to work around pressure. Removing the gate doesn't free memory — it just lets the process drag the whole machine into swap and freeze. Handle pressure inside the app: retry with cache cleared, smaller batches, or fall back to a slower-but-bounded path (e.g. CPU). Same rule applies to file descriptors, threads, and any other limit that exists to keep the system responsive.

## Git

Work directly on `main` — commit sequentially after each piece of work; create a feature branch only when explicitly asked.
