# Filesystem Architecture

## Colocation Principle

Colocate by default — put state, hooks, handlers, components, and types as close to their consumer as possible. Only lift when a second consumer needs it.

## Core Structure

```
src/
├── app/            # Next.js App Router (pages, layouts, API routes)
├── components/     # Design-system primitives + components shared across 2+ routes
├── lib/            # Utilities (hooks, helpers, services, consts)
├── store/          # Zustand stores
└── types/          # Global type definitions
```

`src/components/` is reserved for:

- **Design-system primitives** (icons, Select, Tooltip) — stay global even if currently single-route
- **Components used by 2+ routes** (e.g., VoiceSelect used by book + settings)

Route-specific components live in `app/{feature}/components/` even if they seem "generic".

## App Directory Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Home page
├── globals.css             # Tailwind imports + base styles
├── {feature}/
│   ├── page.tsx            # Feature page
│   ├── components/         # Page-specific components
│   └── helpers/            # Page-specific utilities
├── [param]/
│   └── page.tsx            # Dynamic route
└── api/
    └── {endpoint}/
        └── route.ts        # API route handler
```

## Component File Structure

**Standard:**

```
Component/
├── Component.tsx           # Implementation
├── Component.types.ts      # Types
├── Component.consts.ts     # Constants
├── Component.vi.tsx        # Tests
├── components/             # Subcomponents
├── hooks/                  # Feature-specific hooks
└── helpers/                # Utilities
```

## Hook Structure

```
lib/hooks/useHookName/
├── useHookName.ts          # Implementation
├── useHookName.types.ts    # Types (if complex)
├── useHookName.vi.ts       # Tests
└── __mocks__/              # Mock for testing
```

## Helper Structure

Helpers are **colocated** — they live next to their consumer in a `helpers/` subdirectory. `lib/helpers/` is only for rare, truly cross-cutting utilities with no clear owner.

Any directory can contain a `helpers/` folder: components, pages, hooks, other helpers. Nesting is unlimited.

```
# Helper next to a component
Component/
├── Component.tsx
└── helpers/
    └── getABC/
        ├── getABC.ts
        └── getABC.vi.ts

# Helper with its own sub-helpers
getABC/
├── getABC.ts
└── helpers/
    └── getA/
        └── getA.ts

# Helper next to a page
app/book/[id]/
├── page.tsx
└── helpers/
    └── computeProgress/
        └── computeProgress.ts

# Global helpers (only for highly reusable functions used by many consumers)
lib/helpers/{helperName}/
├── {helperName}.ts
└── {helperName}.vi.ts
```

**One exported function per helper directory** — don't group related small functions into a shared folder. Even closely related utilities (e.g. `getPlainText` and `getInnerHtml`) get separate directories. A helper directory contains: implementation file, tests, types (if complex), consts (if needed), and a `helpers/` subdirectory for sub-helpers.

## File Placement Decision Tree

```
Design-system primitive (icon, tooltip, select)? → components/
Used by 2+ routes? → components/
Used by 1 route only? → app/{feature}/components/
Hook? → lib/hooks/{hookName}/
Helper function? → consumer's helpers/ dir (colocated)
Highly reusable, many consumers? → lib/helpers/{helperName}/
Service? → lib/services/{serviceName}/
```

## Key Conventions

- **No barrel exports** - do NOT create `index.ts` re-export files; import from actual paths
- **Named exports only** - except Next.js pages
- **Tailwind only** - no separate style files
- **One directory per function** - each hook or helper exports a single function with all its related files
- **No .helpers.ts files** - helpers are directories, not files (e.g., `helpers/parseHtml/parseHtml.ts`)
- **`'use client'`** - at top of files using hooks/browser APIs
