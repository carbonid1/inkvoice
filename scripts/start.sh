#!/bin/bash

# InkVoice Startup Script
# Launches both the Python TTS API and Next.js frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

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

# Create data/books if it doesn't exist
mkdir -p data/books

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
printf "${GREEN}Starting Next.js on :3000...${NC}\n"
pnpm dev:next &
NEXT_PID=$!

printf "\n${GREEN}InkVoice is running!${NC}\n"
printf "  Frontend: ${YELLOW}http://localhost:3000${NC}\n"
printf "  TTS API:  ${YELLOW}http://localhost:8000${NC}\n"
printf "\nPress Ctrl+C to stop both servers.\n"

# Wait for either process to exit
wait
