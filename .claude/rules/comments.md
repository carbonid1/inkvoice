# Comments

- Default to no comments. Add one when the _why_ is non-obvious — a hidden constraint, subtle invariant, workaround for a specific bug, surprising behavior, negative-space contract ("don't call this with X"), optimization rationale, or operational note for whoever runs the code in production.
- Don't explain _what_ the code does. First try renaming the identifier so the name carries the meaning; only write a comment if renaming would force a worse name or fragment the code into tiny single-use helpers.
- Exported hooks, helpers, and components may carry a short JSDoc covering inputs, outputs, and any caller-side caveat (nullability beyond the type, ordering, idempotency, side effects). TypeScript types cover the shape and the colocated test covers the happy path — the docstring covers the behavioral contract a caller can't see from the signature.
- Don't reference the current task, fix, or callers ("used by X", "added for the Y flow", "handles the case from #123") — that belongs in the commit/PR description and rots as the codebase evolves.
- Don't narrate the diff: never write "no longer X", "now vs before", or anything that only makes sense to a reader with the diff in front of them. A comment must stand alone for a reader with zero diff context.
- Keep comments short. Prefer one line; allow more only when documenting a behavioral contract or naming several non-obvious *why*s at once.
- When you change code, update or delete adjacent comments — and when you can't confirm a comment still describes the code, delete it rather than leave it ambiguous. A stale comment is worse than no comment.
