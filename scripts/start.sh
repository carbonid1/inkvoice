#!/bin/bash

# InkVoice Startup Script
# Launches both the Python TTS API and Next.js frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

PORTLESS_PORT=1355
PORTLESS_URL="https://inkvoice.localhost:${PORTLESS_PORT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

printf "${GREEN}Starting InkVoice...${NC}\n"

# Check if portless is installed
if ! command -v portless >/dev/null 2>&1; then
    printf "${RED}portless is not installed.${NC}\n"
    printf "InkVoice uses portless to serve the app at a stable %s URL.\n" "$PORTLESS_URL"
    printf "Install it globally (a single shared daemon serves every project on the machine):\n"
    printf "  ${YELLOW}npm install -g portless${NC}\n"
    printf "Then start the proxy once:\n"
    printf "  ${YELLOW}portless proxy start --port %s --https${NC}\n" "$PORTLESS_PORT"
    exit 1
fi

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
pnpx prisma migrate deploy 2>&1 || {
    printf "${RED}Database migration failed. Run 'pnpm db:migrate' to debug.${NC}\n"
    exit 1
}
pnpx prisma generate 2>&1 > /dev/null

# Function to cleanup background processes on exit
cleanup() {
    printf "\n${YELLOW}Shutting down...${NC}\n"
    # Signal parents first — let uvicorn/next handle child cleanup
    kill $PYTHON_PID $NEXT_PID 2>/dev/null || true
    wait 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Python API
printf "${GREEN}Starting Python TTS API on :8000...${NC}\n"
source venv/bin/activate
# Suppress false-positive semaphore leak warning from Python 3.11 resource_tracker
# during uvicorn --reload shutdown (known multiprocessing race condition)
PYTHONWARNINGS="ignore::UserWarning:multiprocessing.resource_tracker" \
    uvicorn api.app.main:app --reload --port 8000 &
PYTHON_PID=$!

# Wait a moment for Python to start
sleep 2

# Start Next.js
printf "${GREEN}Starting Next.js via portless...${NC}\n"
pnpm dev:next &
NEXT_PID=$!

printf "\n${GREEN}InkVoice is running!${NC}\n"
printf "  Frontend: ${YELLOW}%s${NC} (branch-prefixed in worktrees)\n" "$PORTLESS_URL"
printf "  TTS API:  ${YELLOW}http://localhost:8000${NC}\n"
printf "\nPress Ctrl+C to stop both servers.\n"

# Wait for either process to exit
wait
