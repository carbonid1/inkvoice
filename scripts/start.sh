#!/bin/bash

# InkVoice Startup Script
# Launches both the Python TTS API and Next.js frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

NEXT_PORT=49813
NEXT_URL="http://localhost:${NEXT_PORT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

printf "${GREEN}Starting InkVoice...${NC}\n"

# Check if venv exists
if [ ! -d "venv" ]; then
    printf "${YELLOW}Python venv not found. Please run:${NC}\n"
    printf "  cd %s\n" "$PROJECT_DIR"
    printf "  python3.11 -m venv venv\n"
    printf "  source venv/bin/activate\n"
    printf "  pip install -r api/requirements.txt\n"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    printf "${YELLOW}node_modules not found. Running pnpm install...${NC}\n"
    pnpm install
fi

# Create data directories if they don't exist
mkdir -p data/books

# Set dev database path (prod uses INKVOICE_DB_PATH=data/inkvoice.db)
export INKVOICE_DB_PATH="${INKVOICE_DB_PATH:-data/inkvoice-dev.db}"

# Run database migrations
printf "${GREEN}Running database migrations...${NC}\n"
pnpm db:deploy 2>&1 || {
    printf "${RED}Database migration failed. Run 'pnpm db:migrate' to debug.${NC}\n"
    exit 1
}
pnpm db:generate 2>&1 > /dev/null

# Function to cleanup background processes on exit
cleanup() {
    printf "\n${YELLOW}Shutting down...${NC}\n"
    # Signal parents first — control plane handles Python cleanup, next handles its own children
    kill $CONTROL_PID $NEXT_PID 2>/dev/null || true
    wait 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Build the dev control-plane runner (bundles electron/lib/* — no Electron dep at runtime)
printf "${GREEN}Building dev control-plane...${NC}\n"
pnpm exec tsup scripts/dev-control-plane.ts --outDir dist-electron --format cjs --external electron > /dev/null 2>&1

# Pick a free port for the control plane
CONTROL_PORT=$(node -e "const n=require('net'),s=n.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>console.log(p))})")
export INKVOICE_PYTHON_CONTROL_URL="http://127.0.0.1:${CONTROL_PORT}"
export INKVOICE_PROJECT_ROOT="$PROJECT_DIR"

# Start the control plane (owns Python lifecycle: lazy-spawn, idle-shutdown after 5 min)
printf "${GREEN}Starting Python TTS control plane on :${CONTROL_PORT}...${NC}\n"
node dist-electron/dev-control-plane.js --control-port "$CONTROL_PORT" &
CONTROL_PID=$!

# Start Next.js
printf "${GREEN}Starting Next.js on :${NEXT_PORT}...${NC}\n"
pnpm dev:next &
NEXT_PID=$!

printf "\n${GREEN}InkVoice is running!${NC}\n"
printf "  Frontend: ${YELLOW}%s${NC}\n" "$NEXT_URL"
printf "  Control:  ${YELLOW}%s${NC} (Python TTS lazy-spawned on demand)\n" "$INKVOICE_PYTHON_CONTROL_URL"
printf "\nPress Ctrl+C to stop both servers.\n"

# Wait for either process to exit
wait
