#!/usr/bin/env bash
# WorktreeCreate hook: creates worktree, symlinks shared user-content,
# and installs dependencies.
#
# Contract: read JSON from stdin, print the worktree absolute path to stdout.
# All other output MUST go to stderr.
#
# Symlink policy:
#   data/books, data/voices, data/cache  -> symlinked from main repo (user
#     content + content-addressed TTS cache; sharing is safe and avoids
#     re-downloading audio or recreating voice references)
#   data/inkvoice-dev.db  -> intentionally NOT shared (Prisma migrations on
#     a feature branch must not corrupt main reading-progress db)
#   data/starter-books    -> intentionally NOT shared (regenerates on first
#     run; keeps first-run UX testable on a branch)

set -euo pipefail

INPUT=$(cat)
ORIG_CWD=$(echo "$INPUT" | jq -r '.cwd')
WORKTREE_NAME=$(echo "$INPUT" | jq -r '.name // "worktree"')

WORKTREE_DIR="$ORIG_CWD/.claude/worktrees/$WORKTREE_NAME"
mkdir -p "$(dirname "$WORKTREE_DIR")"
git -C "$ORIG_CWD" worktree add "$WORKTREE_DIR" -b "$WORKTREE_NAME" >&2

mkdir -p "$WORKTREE_DIR/data" "$WORKTREE_DIR/data/voices"
# books and cache are gitignored top-level dirs — safe to symlink whole tree.
# voices/ contains tracked voice samples in the worktree; only the gitignored
# voices/custom subdir (user-uploaded references) is shared from main.
for path in books cache voices/custom; do
  src="$ORIG_CWD/data/$path"
  dest="$WORKTREE_DIR/data/$path"
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    echo "Skipped data/$path (already exists)" >&2
    continue
  fi
  if [ -d "$src" ]; then
    ln -s "$src" "$dest"
    echo "Linked data/$path" >&2
  fi
done

echo "Installing dependencies..." >&2
(cd "$WORKTREE_DIR" && CI=true pnpm install --frozen-lockfile --prefer-offline) >&2

echo "$WORKTREE_DIR"
