#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/.venv/bin/python3}"
ALEMBIC_BIN="${ALEMBIC_BIN:-$ROOT_DIR/.venv/bin/alembic}"
PNPM_BIN="${PNPM_BIN:-pnpm}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.orchestrator.yml"

export ORCHESTRATOR_POSTGRES_PORT="${ORCHESTRATOR_POSTGRES_PORT:-5432}"
export ORCHESTRATOR_REDIS_PORT="${ORCHESTRATOR_REDIS_PORT:-6379}"
export ORCHESTRATOR_MINIO_PORT="${ORCHESTRATOR_MINIO_PORT:-9000}"
export ORCHESTRATOR_MINIO_CONSOLE_PORT="${ORCHESTRATOR_MINIO_CONSOLE_PORT:-9001}"

export ORCHESTRATOR_DATABASE_URL="${ORCHESTRATOR_DATABASE_URL:-postgresql+asyncpg://dot:dot@127.0.0.1:${ORCHESTRATOR_POSTGRES_PORT}/dot_orchestrator}"
export ORCHESTRATOR_REDIS_URL="${ORCHESTRATOR_REDIS_URL:-redis://127.0.0.1:${ORCHESTRATOR_REDIS_PORT}/0}"
export ORCHESTRATOR_LOCAL_OBJECT_STORE_ROOT="${ORCHESTRATOR_LOCAL_OBJECT_STORE_ROOT:-.data/orchestrator-objects}"

export VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}"
export VITE_ORCHESTRATOR_URL="${VITE_ORCHESTRATOR_URL:-http://127.0.0.1:8000}"
export VITE_ORCHESTRATOR_OWNER_ID="${VITE_ORCHESTRATOR_OWNER_ID:-habte}"
export VITE_PROFILE_DELIVERY_OWNER_ID="${VITE_PROFILE_DELIVERY_OWNER_ID:-habte}"
export VITE_PROFILE_DELIVERY_SLUG="${VITE_PROFILE_DELIVERY_SLUG:-habte-profile}"

PIDS=()

fail() {
  echo "dev-stack: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command '$1'"
}

require_file() {
  [ -e "$1" ] || fail "$2"
}

stop_tree() {
  local pid="$1"
  if command -v pgrep >/dev/null 2>&1; then
    local children
    children="$(pgrep -P "$pid" 2>/dev/null || true)"
    if [ -n "$children" ]; then
      kill $children 2>/dev/null || true
    fi
  fi
  kill "$pid" 2>/dev/null || true
}

cleanup() {
  if [ "${#PIDS[@]}" -gt 0 ]; then
    echo
    echo "Stopping dev stack..."
    for pid in "${PIDS[@]}"; do
      stop_tree "$pid"
    done
    wait "${PIDS[@]}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

wait_for_tcp() {
  local name="$1"
  local host="$2"
  local port="$3"
  local max_attempts="${4:-60}"

  echo "Waiting for ${name} on ${host}:${port}..."
  for _ in $(seq 1 "$max_attempts"); do
    if (exec 3<>"/dev/tcp/${host}/${port}") >/dev/null 2>&1; then
      exec 3<&-
      exec 3>&-
      echo "${name} is ready."
      return 0
    fi
    sleep 1
  done

  fail "${name} did not become reachable on ${host}:${port}"
}

start_service() {
  local name="$1"
  local dir="$2"
  shift 2

  echo "Starting ${name}..."
  (
    cd "$dir"
    exec "$@"
  ) &
  PIDS+=("$!")
}

require_command docker
require_command "$PNPM_BIN"
require_file "$PYTHON_BIN" "missing Python venv at .venv; run make install-backend install-orchestrator first"
require_file "$ALEMBIC_BIN" "missing Alembic in .venv; run make install-orchestrator first"
require_file "$COMPOSE_FILE" "missing docker-compose.orchestrator.yml"
require_file "$ROOT_DIR/frontend/node_modules" "missing frontend dependencies; run make install-frontend first"

echo "Starting local infrastructure..."
docker compose -f "$COMPOSE_FILE" up -d

wait_for_tcp "Postgres" "127.0.0.1" "$ORCHESTRATOR_POSTGRES_PORT"
wait_for_tcp "Redis" "127.0.0.1" "$ORCHESTRATOR_REDIS_PORT"
wait_for_tcp "MinIO" "127.0.0.1" "$ORCHESTRATOR_MINIO_PORT"

echo "Applying orchestrator migrations..."
(
  cd "$ROOT_DIR/backend/orchestrator"
  "$ALEMBIC_BIN" upgrade head
)

echo "Seeding profile delivery release..."
(
  cd "$ROOT_DIR/backend/orchestrator"
  "$PYTHON_BIN" scripts/seed_profile_delivery.py
)

start_service "Flask API" "$ROOT_DIR/backend" "$PYTHON_BIN" src/main.py
start_service "FastAPI orchestrator" "$ROOT_DIR/backend/orchestrator" "$PYTHON_BIN" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
start_service "orchestrator worker" "$ROOT_DIR/backend/orchestrator" "$PYTHON_BIN" -m dramatiq app.workers.tasks
start_service "Vite frontend" "$ROOT_DIR" "$PNPM_BIN" --dir frontend dev

cat <<EOF

Full dev stack is running.

Frontend:             http://localhost:5173
Frontend owner mode:  http://localhost:5173/?owner=1
Flask API:            http://127.0.0.1:5000/api
Orchestrator API:     http://127.0.0.1:8000/docs
Profile release:      http://localhost:5173/read/habte/habte-profile
MinIO console:        http://127.0.0.1:${ORCHESTRATOR_MINIO_CONSOLE_PORT}

Press Ctrl-C to stop app processes. Docker services stay up; run
make orchestrator-services-down to stop Postgres, Redis, and MinIO.

EOF

while true; do
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid"
      exit $?
    fi
  done
  sleep 2
done
