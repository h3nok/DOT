#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/.venv/bin/python3}"
ALEMBIC_BIN="${ALEMBIC_BIN:-$ROOT_DIR/.venv/bin/alembic}"
VITE_BIN="${VITE_BIN:-$ROOT_DIR/frontend/node_modules/.bin/vite}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.orchestrator.yml"

MINIO_CONSOLE_PORT_WAS_SET=0
if [ -n "${ORCHESTRATOR_MINIO_CONSOLE_PORT:-}" ]; then
  MINIO_CONSOLE_PORT_WAS_SET=1
fi

export ORCHESTRATOR_POSTGRES_PORT="${ORCHESTRATOR_POSTGRES_PORT:-5432}"
export ORCHESTRATOR_REDIS_PORT="${ORCHESTRATOR_REDIS_PORT:-6379}"
export ORCHESTRATOR_MINIO_PORT="${ORCHESTRATOR_MINIO_PORT:-9000}"
export ORCHESTRATOR_MINIO_CONSOLE_PORT="${ORCHESTRATOR_MINIO_CONSOLE_PORT:-9001}"

export ORCHESTRATOR_DATABASE_URL="${ORCHESTRATOR_DATABASE_URL:-postgresql+asyncpg://dot:dot@127.0.0.1:${ORCHESTRATOR_POSTGRES_PORT}/dot_orchestrator}"
export ORCHESTRATOR_REDIS_URL="${ORCHESTRATOR_REDIS_URL:-redis://127.0.0.1:${ORCHESTRATOR_REDIS_PORT}/0}"
export ORCHESTRATOR_LOCAL_OBJECT_STORE_ROOT="${ORCHESTRATOR_LOCAL_OBJECT_STORE_ROOT:-.data/orchestrator-objects}"

export VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}"
export VITE_ORCHESTRATOR_URL="${VITE_ORCHESTRATOR_URL:-http://127.0.0.1:8000}"
export VITE_ORCHESTRATOR_OWNER_ID="${VITE_ORCHESTRATOR_OWNER_ID:-henok}"
export VITE_PROFILE_DELIVERY_OWNER_ID="${VITE_PROFILE_DELIVERY_OWNER_ID:-henok}"
export VITE_PROFILE_DELIVERY_SLUG="${VITE_PROFILE_DELIVERY_SLUG:-henok-profile}"

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

port_is_reachable() {
  local host="$1"
  local port="$2"
  (exec 3<>"/dev/tcp/${host}/${port}") >/dev/null 2>&1
}

prepare_minio_console_port() {
  local configured_port="$ORCHESTRATOR_MINIO_CONSOLE_PORT"
  local existing_port=""
  local candidate
  local attempts=0

  case "$configured_port" in
    '' | *[!0-9]*) fail "MinIO console port must be a number, got '${configured_port}'" ;;
  esac

  # A prior run may already have DOT's MinIO published on a fallback port. Reuse
  # that mapping so repeated `make start` calls do not recreate the container.
  existing_port="$(docker compose -f "$COMPOSE_FILE" port orchestrator-minio 9001 2>/dev/null | head -n 1 | awk -F: '{print $NF}' || true)"
  if [ "$existing_port" = "$configured_port" ]; then
    return 0
  fi
  if [ "$MINIO_CONSOLE_PORT_WAS_SET" = "0" ] && [[ "$existing_port" =~ ^[0-9]+$ ]]; then
    export ORCHESTRATOR_MINIO_CONSOLE_PORT="$existing_port"
    echo "Reusing MinIO console port ${existing_port} from the running DOT container."
    return 0
  fi

  if ! port_is_reachable "127.0.0.1" "$configured_port"; then
    return 0
  fi

  if [ "$MINIO_CONSOLE_PORT_WAS_SET" = "1" ]; then
    fail "MinIO console port ${configured_port} is already in use; stop that service or run ORCHESTRATOR_MINIO_CONSOLE_PORT=<free-port> make start"
  fi

  candidate="$configured_port"
  while [ "$attempts" -lt 50 ]; do
    candidate=$((candidate + 1))
    if [ "$candidate" -gt 65535 ]; then
      break
    fi
    if ! port_is_reachable "127.0.0.1" "$candidate"; then
      export ORCHESTRATOR_MINIO_CONSOLE_PORT="$candidate"
      echo "MinIO console port ${configured_port} is in use; using ${candidate} for DOT."
      return 0
    fi
    attempts=$((attempts + 1))
  done

  fail "could not find a free MinIO console port after ${configured_port}"
}

prepare_local_auth_secret() {
  local env_file="$ROOT_DIR/backend/orchestrator/.env"
  local configured_secret=""
  local secret_file="$ROOT_DIR/.data/orchestrator-service-auth-secret"

  if [ -n "${ORCHESTRATOR_SERVICE_AUTH_SECRET:-}" ]; then
    return 0
  fi

  if [ -f "$env_file" ]; then
    configured_secret="$(sed -n 's/^ORCHESTRATOR_SERVICE_AUTH_SECRET=//p' "$env_file" | head -n 1 | tr -d '\r')"
    case "$configured_secret" in
      '' | '""' | "''") ;;
      *) return 0 ;;
    esac
  fi

  mkdir -p "$(dirname "$secret_file")"
  if [ ! -s "$secret_file" ]; then
    (umask 077; "$PYTHON_BIN" -c 'import secrets; print(secrets.token_hex(32))' >"$secret_file")
    echo "Generated a persistent local auth secret in .data/."
  fi

  export ORCHESTRATOR_SERVICE_AUTH_SECRET="$(tr -d '\r\n' <"$secret_file")"
  [ "${#ORCHESTRATOR_SERVICE_AUTH_SECRET}" -ge 32 ] || fail "local auth secret in .data/ is invalid; remove it and rerun make start"
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
require_file "$PYTHON_BIN" "missing Python venv at .venv; run make install-backend install-orchestrator first"
require_file "$ALEMBIC_BIN" "missing Alembic in .venv; run make install-orchestrator first"
require_file "$VITE_BIN" "missing frontend Vite binary; run make install-frontend first"
require_file "$COMPOSE_FILE" "missing docker-compose.orchestrator.yml"
require_file "$ROOT_DIR/frontend/node_modules" "missing frontend dependencies; run make install-frontend first"

# Reaping this project's own stale dev processes. A previous `make dev` that was
# interrupted (or a stray `make start-*`) leaves uvicorn on :8000 and vite on
# :5173 behind; the new stack then dies on "address already in use" and the whole
# script exits 2. Kill only what is unmistakably ours — this repo's uvicorn,
# dramatiq worker, and vite dev — and leave Docker services and anything else
# (e.g. another tool's sandbox on :8001) alone.
reap_stale() {
  local pattern pids
  for pattern in \
    "uvicorn app.main:app" \
    "dramatiq app.workers.tasks" \
    "frontend/node_modules/.bin.*vite.* dev"; do
    pids="$(pgrep -f "$pattern" 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      # Only kill processes whose command line references this repo, so we never
      # touch an unrelated service that happens to share a binary name.
      for pid in $pids; do
        if tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null | grep -q "$ROOT_DIR"; then
          kill "$pid" 2>/dev/null || true
        fi
      done
    fi
  done
  # Give the OS a moment to release the sockets before we bind them again.
  sleep 1
}

echo "Clearing any stale DOT dev processes..."
reap_stale

prepare_minio_console_port
prepare_local_auth_secret

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

start_service "FastAPI orchestrator" "$ROOT_DIR/backend/orchestrator" "$PYTHON_BIN" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
start_service "orchestrator worker" "$ROOT_DIR/backend/orchestrator" "$PYTHON_BIN" -m dramatiq app.workers.tasks
start_service "Vite frontend" "$ROOT_DIR/frontend" "$VITE_BIN" dev

cat <<EOF

Full dev stack is running.

Frontend:             http://localhost:5173
Frontend owner mode:  http://localhost:5173/?owner=1
Orchestrator API:     http://127.0.0.1:8000/docs
Profile release:      http://localhost:5173/read/henok/henok-profile
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
