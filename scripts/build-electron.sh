#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Building InkVoice Electron app...${NC}"

# Step 1: Download Node.js binary
echo -e "\n${YELLOW}[1/5] Downloading Node.js binary...${NC}"
bash scripts/download-node.sh

# Step 2: Build Python runtime
echo -e "\n${YELLOW}[2/5] Building Python runtime (this may take a while)...${NC}"
bash scripts/build-python.sh

# Step 3: Build Next.js standalone
echo -e "\n${YELLOW}[3/5] Building Next.js...${NC}"
pnpx prisma generate
pnpm build

# Prepare the standalone output with static files
# Use rsync -aL to dereference pnpm symlinks (critical for portable node_modules)
echo -e "${YELLOW}       Preparing standalone bundle...${NC}"
rm -rf dist-nextjs
rsync -aL --ignore-errors .next/standalone/ dist-nextjs/ 2>/dev/null || true
rsync -aL .next/static/ dist-nextjs/.next/static/
rsync -aL public/ dist-nextjs/public/
rm -rf dist-nextjs/data

# Flatten pnpm's .pnpm/ structure into top-level node_modules.
# pnpm nests ALL transitive deps inside .pnpm/{pkg}/node_modules/{dep}.
# After rsync -aL, these nested deps can't find each other via Node's resolution.
# Strategy: first hoist deps from the top-level packages (next, jsdom, epub2, etc.)
# so their versions take priority, then fill in remaining packages.
echo -e "${YELLOW}       Flattening pnpm node_modules...${NC}"
node -e "
const fs = require('fs');
const path = require('path');
const pnpmDir = 'dist-nextjs/node_modules/.pnpm';
const topLevel = 'dist-nextjs/node_modules';
let count = 0;

function hoistFrom(nmDir) {
  if (!fs.existsSync(nmDir)) return;
  for (const pkg of fs.readdirSync(nmDir)) {
    if (pkg.startsWith('.')) continue;
    if (pkg.startsWith('@')) {
      const scopeDir = path.join(nmDir, pkg);
      if (!fs.statSync(scopeDir).isDirectory()) continue;
      for (const sub of fs.readdirSync(scopeDir)) {
        const dest = path.join(topLevel, pkg, sub);
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.cpSync(path.join(scopeDir, sub), dest, { recursive: true });
          count++;
        }
      }
    } else {
      const dest = path.join(topLevel, pkg);
      if (!fs.existsSync(dest)) {
        fs.cpSync(path.join(nmDir, pkg), dest, { recursive: true });
        count++;
      }
    }
  }
}

// Phase 1: hoist from top-level packages first (their dep versions take priority)
const topPkgs = fs.readdirSync(topLevel).filter(p => !p.startsWith('.'));
for (const pkg of topPkgs) {
  // Find this package's .pnpm entry and hoist its siblings
  for (const entry of fs.readdirSync(pnpmDir)) {
    if (!entry.startsWith(pkg + '@')) continue;
    hoistFrom(path.join(pnpmDir, entry, 'node_modules'));
    break;
  }
}

// Phase 2: hoist everything else (fills gaps)
for (const entry of fs.readdirSync(pnpmDir)) {
  hoistFrom(path.join(pnpmDir, entry, 'node_modules'));
}

console.log('         Hoisted ' + count + ' packages');
"

# Step 4: Compile Electron TypeScript
echo -e "\n${YELLOW}[4/5] Compiling Electron...${NC}"
pnpm run build:electron

# Step 5: Package with electron-builder
echo -e "\n${YELLOW}[5/5] Packaging with electron-builder...${NC}"
rm -rf dist

if [ "$1" = "--no-dmg" ]; then
  npx electron-builder --mac --arm64 --dir
else
  npx electron-builder --mac --arm64
fi

echo -e "\n${GREEN}Build complete!${NC}"
echo -e "App: ${YELLOW}dist/mac-arm64/InkVoice.app${NC}"
ls -lh dist/*.dmg 2>/dev/null || true
