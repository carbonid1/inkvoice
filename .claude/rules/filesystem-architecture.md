# Filesystem Architecture

## Placement

- `src/components/` — design-system primitives and components used by 2+ routes
- Route-specific components → `app/{feature}/components/` (even if they seem generic)
- Hooks → `lib/hooks/{hookName}/{hookName}.ts`
- Helpers → colocated in consumer's `helpers/{helperName}/{helperName}.ts`
- Services → `lib/services/{name}/{name}.service.ts`
- `lib/helpers/` — only for truly cross-cutting, many-consumer utilities (rare)

**Colocate by default.** Lift to shared scope only when a 2nd consumer emerges.

## Directory-Name Convention

Every unit directory has a main file matching its name; siblings prefix with the directory name.

```
foo/
├── foo.ts
├── foo.types.ts
├── foo.consts.ts
├── foo.test.ts
├── components/
├── hooks/
└── helpers/
```

Consequence: `Glob "**/foo*"` surfaces the whole unit in one call.

## Escalation (keep inline until…)

| Extract to                     | When                                            |
| ------------------------------ | ----------------------------------------------- |
| `.types.ts`                    | Type block > ~20 lines, or cross-file reference |
| `.consts.ts`                   | ≥ 3 related consts, or prose/fixture data       |
| `.test.ts` / `.test.tsx`       | Logic worth testing exists                      |
| `components/`, `hooks/` subdir | Subunit > ~30 lines, or reused within the unit  |
| `helpers/`                     | Helper has its own tests or sub-helpers         |

## Splitting a File

Split when: data mixed with control flow → `.consts.ts`; a 2nd consumer emerges; concerns genuinely interleaved. **File length alone is not a reason** — a coherent 500-line file beats 10 files you click between.

## Key Conventions

- **No barrel exports** — no `index.ts` re-exports. Import from actual paths.
- **Named exports only** (except Next.js pages).
- **One exported function per helper directory** — don't group siblings. `getPlainText` and `getInnerHtml` get separate directories.
- **No `.helpers.ts` files** — helpers are directories.
- **Tailwind only** — no separate style files.
