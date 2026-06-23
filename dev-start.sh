#!/usr/bin/env bash
# PredAI dev startup script — run this from the repo root.
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "╔══════════════════════════════════════════╗"
echo "║        PredAI — Dev Stack Launcher      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Colors ────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; }

# Clean up on exit
cleanup() {
  echo ""
  info "Shutting down all services..."
  kill $ML_PID $API_PID $WEB_PID 2>/dev/null || true
  wait $ML_PID $API_PID $WEB_PID 2>/dev/null || true
  ok "All services stopped."
}
trap cleanup EXIT INT TERM

# ── 1. PostgreSQL ────────────────────────────
echo ""
echo "═══════════ Step 1: PostgreSQL ═══════════"
if command -v docker &>/dev/null; then
  # Check if already running
  if docker ps --filter name=pred-ai-postgres --filter status=running --format '{{.Names}}' 2>/dev/null | grep -q pred-ai-postgres; then
    ok "Postgres already running"
  else
    # Remove any stale container
    docker rm pred-ai-postgres 2>/dev/null || true
    info "Starting PostgreSQL on :5433..."
    docker run -d --name pred-ai-postgres \
      -e POSTGRES_USER=predai \
      -e POSTGRES_PASSWORD=predai_dev_password \
      -e POSTGRES_DB=predai \
      -p 5433:5432 \
      postgres:16-alpine >/dev/null 2>&1
    info "Waiting for Postgres to be ready..."
    for i in $(seq 1 30); do
      if docker exec pred-ai-postgres pg_isready -U predai -d predai &>/dev/null; then
        ok "Postgres ready"
        break
      fi
      if [ "$i" -eq 30 ]; then
        fail "Postgres failed to start after 30s — check: docker logs pred-ai-postgres"
        exit 1
      fi
      sleep 1
    done
  fi
else
  # Docker not available — assume Postgres is running externally
  warn "Docker not found. Make sure PostgreSQL is running on localhost:5433 with:"
  warn "  user=predai  password=predai_dev_password  database=predai"
  if ! PGPASSWORD=predai_dev_password psql -h 127.0.0.1 -p 5433 -U predai -d predai -c 'SELECT 1' >/dev/null 2>&1; then
    fail "Cannot connect to PostgreSQL at 127.0.0.1:5433"
    exit 1
  fi
  ok "Postgres reachable"
fi

# ── 2. DB Migrations ─────────────────────────
echo ""
echo "═══════════ Step 2: Database Migrations ═══════════"
cd "$ROOT/apps/api"
npx drizzle-kit migrate 2>&1 || pnpm db:migrate
cd "$ROOT"
ok "Migrations applied"

# ── 3. ML Service ────────────────────────────
echo ""
echo "═══════════ Step 3: ML Service (Python FastAPI) ═══════════"
cd "$ROOT/apps/ml-service"

# Python virtualenv
if [ ! -d .venv ]; then
  info "Creating Python virtualenv..."
  python3 -m venv .venv
  info "Installing ML dependencies..."
  .venv/bin/pip install -r requirements.txt -q
  ok "Python dependencies installed"
else
  ok "Python virtualenv exists"
fi

# Kill any existing service on port 8000
kill $(lsof -ti:8000 2>/dev/null) 2>/dev/null || true
# Wait for port to be free
for i in $(seq 1 5); do
  lsof -ti:8000 2>/dev/null || break
  sleep 1
done

info "Starting ML service on :8000..."
MODEL_DIR=./models DATA_DIR=./data \
  .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 &
ML_PID=$!

# Wait for ML service to be healthy
for i in $(seq 1 15); do
  if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
    ok "ML service ready"
    break
  fi
  if [ "$i" -eq 15 ]; then
    fail "ML service failed to start"
    exit 1
  fi
  sleep 1
done

# Seed model if not loaded
ML_HEALTH=$(curl -sf http://localhost:8000/health 2>/dev/null | grep -o '"model_loaded":true' || echo "false")
if echo "$ML_HEALTH" | grep -q "true"; then
  ok "Model already loaded"
else
  info "Seeding model (training on synthetic data)..."
  curl -sf -X POST http://localhost:8000/train \
    -H 'Content-Type: application/json' \
    -d '{"use_synthetic":true}' > /dev/null
  ok "Model trained"
fi

cd "$ROOT"

# ── 4. Node API ──────────────────────────────
echo ""
echo "═══════════ Step 4: Node API (Express) ═══════════"
cd "$ROOT/apps/api"

# Check if deps are installed
if [ ! -d node_modules ]; then
  info "Installing API dependencies..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  ok "API dependencies installed"
fi

# Kill existing API on port 4000
kill $(lsof -ti:4000 2>/dev/null) 2>/dev/null || true
for i in $(seq 1 5); do
  lsof -ti:4000 2>/dev/null || break
  sleep 1
done

info "Starting API on :4000..."
pnpm dev &
API_PID=$!

# Wait for API to be healthy
for i in $(seq 1 20); do
  if curl -sf http://localhost:4000/api/health >/dev/null 2>&1; then
    ok "API ready"
    break
  fi
  if [ "$i" -eq 20 ]; then
    fail "API failed to start — check: cd apps/api && pnpm dev"
    exit 1
  fi
  sleep 1
done

cd "$ROOT"

# ── 5. Web Frontend ──────────────────────────
echo ""
echo "═══════════ Step 5: Web Frontend (Next.js) ═══════════"
cd "$ROOT/apps/web"

# Check if deps are installed
if [ ! -d node_modules ]; then
  info "Installing web dependencies..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  ok "Web dependencies installed"
fi

# Kill existing web on port 3000
kill $(lsof -ti:3000 2>/dev/null) 2>/dev/null || true
for i in $(seq 1 5); do
  lsof -ti:3000 2>/dev/null || break
  sleep 1
done

info "Starting Next.js on :3000..."
pnpm dev &
WEB_PID=$!

cd "$ROOT"

# Wait for web to be ready
info "Waiting for Next.js (first compile may take ~15s)..."
for i in $(seq 1 45); do
  if curl -sfo /dev/null http://localhost:3000/login 2>/dev/null; then
    ok "Web frontend ready"
    break
  fi
  if [ "$i" -eq 45 ]; then
    fail "Web frontend failed to start — check: cd apps/web && pnpm dev"
    exit 1
  fi
  sleep 1
done

# ── All done ─────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║            ✓  PredAI dev stack is running               ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Frontend  →  http://localhost:3000  (Next.js 16)       ║"
echo "║  API       →  http://localhost:4000  (Node/Express)     ║"
echo "║  ML        →  http://localhost:8000  (Python FastAPI)   ║"
echo "║                                                         ║"
echo "║  Health    →  http://localhost:4000/api/health          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Create an account at http://localhost:3000/signup or login"
echo "if you already have one."
echo ""
info "Press Ctrl+C to stop all services."
echo ""

# Wait indefinitely (cleanup runs on exit)
wait
