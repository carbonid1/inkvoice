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

echo -e "${GREEN}Starting InkVoice...${NC}"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Python venv not found. Please run:${NC}"
    echo "  cd $PROJECT_DIR"
    echo "  python3.11 -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r api/requirements.txt"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found. Running pnpm install...${NC}"
    pnpm install
fi

# Create data/books if it doesn't exist
mkdir -p data/books

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    kill $PYTHON_PID 2>/dev/null || true
    kill $NEXT_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Python API
echo -e "${GREEN}Starting Python TTS API on :8000...${NC}"
source venv/bin/activate
uvicorn api.app.main:app --reload --port 8000 &
PYTHON_PID=$!

# Wait a moment for Python to start
sleep 2

# Start Next.js
echo -e "${GREEN}Starting Next.js on :3000...${NC}"
pnpm dev:next &
NEXT_PID=$!

echo -e "\n${GREEN}InkVoice is running!${NC}"
echo -e "  Frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "  TTS API:  ${YELLOW}http://localhost:8000${NC}"
echo -e "\nPress Ctrl+C to stop both servers."

# Wait for either process to exit
wait
