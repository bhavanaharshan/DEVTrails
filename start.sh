#!/bin/bash
# ─────────────────────────────────────────────────────────────
# GigShield — Local Dev Startup Script (No Docker)
# Run from the root of the GigShield folder: bash start.sh
# ─────────────────────────────────────────────────────────────

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/neema-backend"
ML="$ROOT/DEVTrails-ml-engine"
TRIGGER="$ROOT/DEVTrails-api_core_logic/api_core_logic"
FRONTEND="$ROOT/gigshield-frontend"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       GigShield Local Dev Launcher       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Prerequisite checks ────────────────────────────────────────
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "${RED}✗ '$1' not found. Please install it and re-run.${NC}"
    exit 1
  fi
}

check_cmd node
check_cmd npm
check_cmd python3

echo -e "${GREEN}✓ node, npm, python3 found${NC}"
echo ""

# ── PostgreSQL check (optional warning) ───────────────────────
if ! command -v psql &>/dev/null; then
  echo -e "${YELLOW}⚠ psql not found — the backend needs PostgreSQL running locally."
  echo "  Install PostgreSQL and create a DB, or run just the DB via Docker:"
  echo "  docker run -d -e POSTGRES_PASSWORD=neema -e POSTGRES_DB=postgres -p 5432:5432 postgis/postgis:16-3.4"
  echo -e "${NC}"
fi

# ── Python venv + deps ─────────────────────────────────────────
echo "── ML Engine: setting up Python venv ──"
cd "$ML"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
deactivate
echo -e "${GREEN}✓ ML Engine dependencies ready${NC}"
echo ""

# ── Node deps ──────────────────────────────────────────────────
echo "── Backend: npm install ──"
cd "$BACKEND"
npm install --silent
echo -e "${GREEN}✓ Backend dependencies ready${NC}"
echo ""

echo "── Trigger Engine: npm install ──"
cd "$TRIGGER"
npm install --silent
echo -e "${GREEN}✓ Trigger Engine dependencies ready${NC}"
echo ""

echo "── Frontend: npm install ──"
cd "$FRONTEND"
npm install --legacy-peer-deps --silent
echo -e "${GREEN}✓ Frontend dependencies ready${NC}"
echo ""

# ── Launch all services in background ─────────────────────────
echo "══════════════════════════════════════════"
echo "  Starting all services..."
echo "══════════════════════════════════════════"
echo ""

# 1. ML Engine (FastAPI)
cd "$ML"
source .venv/bin/activate
PORT=8000 uvicorn main:app --host 0.0.0.0 --port 8000 --reload > "$ROOT/logs/ml-engine.log" 2>&1 &
ML_PID=$!
deactivate
echo -e "${GREEN}✓ ML Engine started${NC}     → http://localhost:8000  (pid $ML_PID)"

# 2. Backend (Node/Express)
cd "$BACKEND"
DATABASE_URL="postgresql://postgres:neema@localhost:5432/postgres" \
PORT=3001 \
ML_ENGINE_URL="http://localhost:8000" \
node server.js > "$ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started${NC}        → http://localhost:3001  (pid $BACKEND_PID)"

# 3. Trigger Engine
sleep 2  # give backend a moment
cd "$TRIGGER"
USERS_API_URL="http://localhost:3001/api/users/active" \
WEBHOOK_URL="http://localhost:3001/api/claims/trigger" \
FLAGGED_URL="http://localhost:3001/api/claims/flagged" \
ML_ENGINE_URL="http://localhost:8000/api/v1/premium/fraud-check" \
TEST_MODE=false \
node index.js > "$ROOT/logs/trigger-engine.log" 2>&1 &
TRIGGER_PID=$!
echo -e "${GREEN}✓ Trigger Engine started${NC} → http://localhost:3002  (pid $TRIGGER_PID)"

# 4. Frontend (Vite)
cd "$FRONTEND"
VITE_BACKEND_URL="http://localhost:3001" \
VITE_ML_URL="http://localhost:8000" \
npm run dev -- --host > "$ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started${NC}       → http://localhost:5173  (pid $FRONTEND_PID)"

echo ""
echo "══════════════════════════════════════════"
echo -e "  ${GREEN}All services running!${NC}"
echo "  Logs are in: $ROOT/logs/"
echo ""
echo "  Frontend  → http://localhost:5173"
echo "  Backend   → http://localhost:3001"
echo "  ML Engine → http://localhost:8000/docs  (Swagger UI)"
echo "  Trigger   → http://localhost:3002"
echo ""
echo "  Press Ctrl+C to stop everything."
echo "══════════════════════════════════════════"
echo ""

# ── Cleanup on exit ────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Stopping all services..."
  kill $ML_PID $BACKEND_PID $TRIGGER_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
}
trap cleanup INT TERM

# Keep script alive
wait
