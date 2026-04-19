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

mkdir -p "$WORKTREE_DIR/data"
for sub in books voices cache; do
  if [ -d "$ORIG_CWD/data/$sub" ]; then
    ln -s "$ORIG_CWD/data/$sub" "$WORKTREE_DIR/data/$sub"
    echo "Linked data/$sub" >&2
  fi
done

echo "Installing dependencies..." >&2
(cd "$WORKTREE_DIR" && CI=true pnpm install --frozen-lockfile --prefer-offline) >&2

echo "$WORKTREE_DIR"
