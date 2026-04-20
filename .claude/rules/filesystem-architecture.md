# Filesystem Architecture

## AI-First Design

This repo is optimized for AI agents as the primary reader, not humans. That changes the tradeoffs:

- **Predictable names** — every directory contains a main file with the same name. Agents can `Glob "**/foo*"` and find the unit + all its artifacts in one call.
- **Inline-then-escalate, not split-by-default** — each extra file is another tool call to read. Keep things inline until a concrete escalation criterion is met.
- **Cohesion over fragmentation** — a 500-line file that tells one coherent story is better than 10 files you must jump between to understand one feature.
- **Strict uniformity** — one way to do each thing. Two valid spellings (e.g. `foo.helpers.ts` AND `helpers/foo/foo.ts`) double the guesswork on every read.

These rules are a navigation contract. Follow them so the next agent can find things by pattern instead of by reading directory listings.

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

## Directory-Name Convention

Every unit directory contains a main file matching its name. Siblings prefix with the directory name.

```
foo/
├── foo.ts            # Main implementation (or foo.tsx for components)
├── foo.types.ts      # Types (optional — see escalation rules)
├── foo.consts.ts     # Constants (optional — see escalation rules)
├── foo.test.ts         # Tests (expected when logic exists)
├── components/       # Optional — sub-components for this unit
├── hooks/            # Optional — feature-specific hooks for this unit
└── helpers/          # Optional — sub-helpers for this unit
```

Applies to components, hooks, helpers, and services. Consequence for agents: to find everything related to `foo`, run `Glob "**/foo*"` — one call surfaces the main file and every sibling artifact.

## Component Structure

```
Component/
└── Component.tsx           # Start here — everything inline
```

Default: types, constants, handlers, and small subcomponents live inline in `Component.tsx`. Escalate to a sibling only when an escalation criterion below is met.

### Escalation criteria

| File / Dir            | Extract when                                                       |
| --------------------- | ------------------------------------------------------------------ |
| `Component.types.ts`  | Type block > ~20 lines OR referenced by sibling files              |
| `Component.consts.ts` | ≥ 3 related constants OR prose/fixture data (long literal strings) |
| `Component.test.tsx`  | Logic worth testing exists (nearly always, once past a stub)       |
| `components/`         | Subcomponent > ~30 lines OR reused within the unit                 |
| `hooks/`              | Feature-specific hook > ~30 lines OR reused within the unit        |
| `helpers/`            | Helper has its own tests OR its own sub-helpers                    |

## Hook Structure

```
lib/hooks/useHookName/
└── useHookName.ts          # Start here — everything inline
```

Same escalation rules as components:

| File                    | Extract when                                          |
| ----------------------- | ----------------------------------------------------- |
| `useHookName.types.ts`  | Type block > ~20 lines OR referenced by sibling files |
| `useHookName.consts.ts` | ≥ 3 related constants OR prose/fixture data           |
| `useHookName.test.ts`   | Hook has non-trivial logic (see code-style.md)        |
| `__mocks__/`            | Hook is imported by tests of consumers                |
| `helpers/`              | Helper has its own tests OR sub-helpers               |

## Service Structure

```
lib/services/{serviceName}/
└── {serviceName}.service.ts    # Start here — everything inline
```

Services are singletons or stateless service objects under `lib/services/`. Same slot rules as components and hooks:

| File                     | Extract when                                                       |
| ------------------------ | ------------------------------------------------------------------ |
| `{name}.consts.ts`       | ≥ 3 tuning knobs OR prose/fixture data (e.g., long warmup strings) |
| `{name}.types.ts`        | Type block > ~20 lines OR re-exported from the public API          |
| `{name}.service.test.ts` | Logic worth testing exists                                         |
| `helpers/`               | Helper has its own tests OR sub-helpers                            |

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
        └── getABC.test.ts

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
└── {helperName}.test.ts
```

**One exported function per helper directory** — don't group related small functions into a shared folder. Even closely related utilities (e.g. `getPlainText` and `getInnerHtml`) get separate directories. A helper directory contains: implementation file, tests, types (if complex), consts (if needed), and a `helpers/` subdirectory for sub-helpers.

## When to Split a File

Split criteria (use any one):

- **Config or fixture data mixed with control flow** → extract to `.consts.ts`
  (long prose strings, tuning knob tables, enum-like objects)
- **A second consumer emerges** → lift to shared scope
  (imported by 2+ siblings, or 2+ routes)
- **Multiple concerns interleaved** → consider splitting
  (e.g., parsing logic + rendering logic in one file)

Non-criteria:

- **File length alone is not a reason.** A coherent 500-line service that tells one story stays intact. Fragmentation costs tool calls; length costs scrolling.

Heuristic: _"Would a reader find related code faster by scrolling one file, or by clicking between files?"_ Pick accordingly.

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
