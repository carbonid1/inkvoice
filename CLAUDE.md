# InkVoice

## Design System (Aspirational)

Zero raw HTML in feature code. Use `src/components/ui/` first; extend when close; native tag only as last resort and flag it as a future component.

- `src/components/ui/` — design-system primitives, theme-swappable
- `src/components/` — app components built on `ui/`, tied to InkVoice's domain

Colors use semantic CSS tokens in `globals.css`, never hardcoded Tailwind color classes.

Current state is partially migrated — each change moves closer to the goal.
