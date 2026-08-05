#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="$ROOT_DIR/docker-compose.orchestrator.yml"
MIN_NODE_MAJOR="${MIN_NODE_MAJOR:-20}"
PNPM_VERSION="${PNPM_VERSION:-10.4.1}"
ASSUME_YES="${ASSUME_YES:-0}"
SKIP_SYSTEM_PACKAGES="${SKIP_SYSTEM_PACKAGES:-0}"
SKIP_INFRA="${SKIP_INFRA:-0}"
SKIP_SEED="${SKIP_SEED:-0}"
DOCKER_NEEDS_SUDO=0

export ORCHESTRATOR_POSTGRES_PORT="${ORCHESTRATOR_POSTGRES_PORT:-5432}"
export ORCHESTRATOR_REDIS_PORT="${ORCHESTRATOR_REDIS_PORT:-6379}"
export ORCHESTRATOR_MINIO_PORT="${ORCHESTRATOR_MINIO_PORT:-9000}"
export ORCHESTRATOR_MINIO_CONSOLE_PORT="${ORCHESTRATOR_MINIO_CONSOLE_PORT:-9001}"
export ORCHESTRATOR_DATABASE_URL="${ORCHESTRATOR_DATABASE_URL:-postgresql+asyncpg://dot:dot@127.0.0.1:${ORCHESTRATOR_POSTGRES_PORT}/dot_orchestrator}"
export ORCHESTRATOR_REDIS_URL="${ORCHESTRATOR_REDIS_URL:-redis://127.0.0.1:${ORCHESTRATOR_REDIS_PORT}/0}"
export ORCHESTRATOR_LOCAL_OBJECT_STORE_ROOT="${ORCHESTRATOR_LOCAL_OBJECT_STORE_ROOT:-.data/orchestrator-objects}"

section() {
  printf '\n==> %s\n' "$*"
}

say() {
  printf '  %s\n' "$*"
}

fail() {
  printf 'setup-dev: %s\n' "$*" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

docker_cli() {
  if [ "$DOCKER_NEEDS_SUDO" = "1" ]; then
    run_sudo docker "$@"
  else
    docker "$@"
  fi
}

docker_compose() {
  docker_cli compose "$@"
}

confirm() {
  if [ "$ASSUME_YES" = "1" ]; then
    return 0
  fi

  if [ ! -t 0 ]; then
    return 1
  fi

  local answer
  printf '%s [y/N] ' "$1"
  read -r answer
  case "$answer" in
    y | Y | yes | YES) return 0 ;;
    *) return 1 ;;
  esac
}

run_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command_exists sudo; then
    sudo "$@"
  else
    fail "sudo is required to install system packages; install prerequisites manually or rerun with SKIP_SYSTEM_PACKAGES=1"
  fi
}

node_major() {
  if command_exists node; then
    node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || printf '0'
  else
    printf '0'
  fi
}

has_node_major() {
  [ "$(node_major)" -ge "$MIN_NODE_MAJOR" ]
}

find_python() {
  local candidate
  for candidate in python3.12 python3; do
    if command_exists "$candidate" && "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)' >/dev/null 2>&1; then
      command -v "$candidate"
      return 0
    fi
  done
  return 1
}

python_has_venv() {
  local python_bin
  python_bin="$(find_python || true)"
  [ -n "$python_bin" ] && "$python_bin" -m venv --help >/dev/null 2>&1
}

load_homebrew() {
  if command_exists brew; then
    return 0
  fi

  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
}

install_macos_packages() {
  load_homebrew
  if ! command_exists brew; then
    if confirm "Homebrew is missing. Install Homebrew now?"; then
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      load_homebrew
    else
      fail "Homebrew is required for automatic macOS setup: https://brew.sh"
    fi
  fi

  local formulae=()
  python_has_venv || formulae+=(python@3.12)
  has_node_major || formulae+=(node)
  command_exists pnpm || command_exists corepack || formulae+=(pnpm)

  if [ "${#formulae[@]}" -gt 0 ]; then
    say "Installing Homebrew formulae: ${formulae[*]}"
    brew install "${formulae[@]}"
  fi

  if ! command_exists docker; then
    say "Installing Docker Desktop. Open it once setup asks for it."
    brew install --cask docker
  fi
}

install_debian_node() {
  if has_node_major; then
    return 0
  fi

  if confirm "Install Node.js ${MIN_NODE_MAJOR}.x from NodeSource?"; then
    curl -fsSL "https://deb.nodesource.com/setup_${MIN_NODE_MAJOR}.x" | run_sudo bash -
    run_sudo apt-get install -y nodejs
  else
    say "Skipping NodeSource install; distro nodejs may be too old."
    run_sudo apt-get install -y nodejs npm
  fi
}

install_debian_docker() {
  run_sudo apt-get install -y docker.io

  if docker compose version >/dev/null 2>&1 || run_sudo docker compose version >/dev/null 2>&1; then
    return 0
  fi

  run_sudo apt-get install -y docker-compose-plugin || run_sudo apt-get install -y docker-compose-v2 || true
}

install_linux_packages() {
  if command_exists apt-get; then
    run_sudo apt-get update
    run_sudo apt-get install -y ca-certificates curl gnupg python3 python3-venv python3-pip
    install_debian_docker
    install_debian_node
  elif command_exists dnf; then
    run_sudo dnf install -y python3 python3-pip nodejs npm docker docker-compose-plugin
  elif command_exists pacman; then
    run_sudo pacman -Sy --needed --noconfirm python python-pip nodejs npm docker docker-compose
  elif command_exists zypper; then
    run_sudo zypper --non-interactive install python312 python312-pip nodejs20 npm20 docker docker-compose
  else
    fail "unsupported Linux package manager; install Python 3.12+, Node ${MIN_NODE_MAJOR}+, pnpm, Docker, and Docker Compose manually"
  fi
}

install_system_packages() {
  section "Checking system packages"

  if [ "$SKIP_SYSTEM_PACKAGES" = "1" ]; then
    say "Skipping system package installation."
    return 0
  fi

  if python_has_venv && has_node_major && command_exists docker && docker compose version >/dev/null 2>&1; then
    say "Python, Node, Docker, and Docker Compose are present."
    return 0
  fi

  case "$(uname -s)" in
    Darwin) install_macos_packages ;;
    Linux) install_linux_packages ;;
    *) fail "unsupported OS: $(uname -s). This setup supports macOS and Linux." ;;
  esac
}

ensure_python() {
  section "Preparing Python environment"

  local python_bin
  python_bin="$(find_python || true)"
  [ -n "$python_bin" ] || fail "Python 3.12+ is required"
  "$python_bin" -m venv --help >/dev/null 2>&1 || fail "Python venv support is required for $python_bin"

  if [ ! -x "$ROOT_DIR/.venv/bin/python3" ]; then
    say "Creating .venv with $($python_bin --version)"
    "$python_bin" -m venv "$ROOT_DIR/.venv"
  fi

  if ! "$ROOT_DIR/.venv/bin/python3" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)' >/dev/null 2>&1; then
    fail ".venv exists but is not Python 3.12+. Move it aside and rerun make setup."
  fi

  "$ROOT_DIR/.venv/bin/python3" -m pip install --upgrade pip setuptools wheel
  "$ROOT_DIR/.venv/bin/python3" -m pip install -r "$ROOT_DIR/backend/orchestrator/requirements.txt"
}

ensure_node() {
  section "Preparing Node environment"

  has_node_major || fail "Node.js ${MIN_NODE_MAJOR}+ is required; found $(command_exists node && node --version || printf 'none')"

  if ! command_exists pnpm; then
    if command_exists corepack; then
      say "Enabling pnpm with Corepack."
      corepack enable
      corepack prepare "pnpm@$PNPM_VERSION" --activate
    elif command_exists npm; then
      say "Installing pnpm@$PNPM_VERSION globally with npm."
      npm install -g "pnpm@$PNPM_VERSION" || run_sudo npm install -g "pnpm@$PNPM_VERSION"
    else
      fail "pnpm is required and neither corepack nor npm is available"
    fi
  fi

  command_exists pnpm || fail "pnpm was not found after setup"
  say "Node $(node --version), pnpm $(pnpm --version)"
  pnpm --dir frontend install --frozen-lockfile
}

copy_env_if_missing() {
  local source_file="$1"
  local target_file="$2"

  if [ -f "$target_file" ]; then
    say "Keeping existing ${target_file#$ROOT_DIR/}"
    return 0
  fi

  cp "$source_file" "$target_file"
  say "Created ${target_file#$ROOT_DIR/} from ${source_file#$ROOT_DIR/}"
}

prepare_env_files() {
  section "Preparing local env files"
  copy_env_if_missing "$ROOT_DIR/backend/orchestrator/.env.example" "$ROOT_DIR/backend/orchestrator/.env"
  copy_env_if_missing "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
}

linux_docker_user() {
  printf '%s' "${SUDO_USER:-${USER:-$(id -un)}}"
}

offer_docker_group_membership() {
  [ "$(uname -s)" = "Linux" ] || return 0

  local docker_user
  docker_user="$(linux_docker_user)"
  [ -n "$docker_user" ] || return 0
  [ "$docker_user" != "root" ] || return 0
  id "$docker_user" >/dev/null 2>&1 || return 0
  id -nG "$docker_user" | tr ' ' '\n' | grep -qx docker && return 0

  if confirm "Add $docker_user to the docker group for future non-sudo Docker use?"; then
    run_sudo usermod -aG docker "$docker_user"
    say "Added $docker_user to the docker group. Open a new login shell after setup for non-sudo Docker."
  else
    say "Continuing with sudo for Docker during this setup."
  fi
}

docker_is_reachable() {
  if docker info >/dev/null 2>&1; then
    DOCKER_NEEDS_SUDO=0
    return 0
  fi

  if [ "$(uname -s)" = "Linux" ] && run_sudo docker info >/dev/null 2>&1; then
    DOCKER_NEEDS_SUDO=1
    offer_docker_group_membership
    say "Using sudo for Docker during this setup."
    return 0
  fi

  return 1
}

start_docker_service() {
  if [ "$(uname -s)" = "Darwin" ] && command_exists open; then
    say "Starting Docker Desktop."
    open -a Docker >/dev/null 2>&1 || true
    return 0
  fi

  if [ "$(uname -s)" != "Linux" ]; then
    return 0
  fi

  if command_exists systemctl && systemctl list-units >/dev/null 2>&1; then
    say "Starting Docker service with systemctl."
    run_sudo systemctl enable --now docker || run_sudo systemctl start docker || true
  elif command_exists service; then
    say "Starting Docker service."
    run_sudo service docker start || true
  fi
}

ensure_docker_running() {
  section "Checking Docker"

  command_exists docker || fail "Docker is required"
  docker compose version >/dev/null 2>&1 || run_sudo docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required"

  if docker_is_reachable; then
    say "Docker daemon is running."
    return 0
  fi

  start_docker_service

  local attempt
  for attempt in $(seq 1 60); do
    if docker_is_reachable; then
      say "Docker daemon is running."
      return 0
    fi
    sleep 2
  done

  if [ "$(uname -s)" = "Linux" ] && grep -qi microsoft /proc/version 2>/dev/null; then
    fail "Docker is installed but not reachable. In WSL, start Docker Desktop and enable WSL integration for this Ubuntu distro, then rerun make setup."
  fi

  fail "Docker is installed but the daemon is not reachable. Start Docker manually, then rerun make setup."
}

wait_for_tcp() {
  local name="$1"
  local host="$2"
  local port="$3"
  local max_attempts="${4:-60}"
  local attempt

  say "Waiting for ${name} on ${host}:${port}"
  for attempt in $(seq 1 "$max_attempts"); do
    if (exec 3<>"/dev/tcp/${host}/${port}") >/dev/null 2>&1; then
      exec 3<&-
      exec 3>&-
      say "${name} is ready."
      return 0
    fi
    sleep 1
  done

  fail "${name} did not become reachable on ${host}:${port}"
}

prepare_infra() {
  if [ "$SKIP_INFRA" = "1" ]; then
    section "Skipping local infrastructure"
    return 0
  fi

  ensure_docker_running

  section "Starting local infrastructure"
  docker_compose -f "$COMPOSE_FILE" pull
  docker_compose -f "$COMPOSE_FILE" up -d

  wait_for_tcp "Postgres" "127.0.0.1" "$ORCHESTRATOR_POSTGRES_PORT"
  wait_for_tcp "Redis" "127.0.0.1" "$ORCHESTRATOR_REDIS_PORT"
  wait_for_tcp "MinIO" "127.0.0.1" "$ORCHESTRATOR_MINIO_PORT"

  section "Preparing orchestrator database"
  (
    cd "$ROOT_DIR/backend/orchestrator"
    "$ROOT_DIR/.venv/bin/alembic" upgrade head
  )

  if [ "$SKIP_SEED" = "1" ]; then
    say "Skipping seed data."
  else
    (
      cd "$ROOT_DIR/backend/orchestrator"
      "$ROOT_DIR/.venv/bin/python3" scripts/seed_profile_delivery.py
    )
  fi
}

main() {
  install_system_packages
  prepare_env_files
  ensure_python
  ensure_node
  prepare_infra

  cat <<EOF

DOT local development setup is ready.

Next commands:
  make dev                 Start frontend, orchestrator, worker, and local services
  make start-frontend      Start only Vite
  make start-orchestrator  Start only the FastAPI orchestrator

Local services:
  Frontend:         http://localhost:5173
  Orchestrator API: http://127.0.0.1:8000/docs
  MinIO console:    http://127.0.0.1:${ORCHESTRATOR_MINIO_CONSOLE_PORT}

Useful flags:
  ASSUME_YES=1 make setup              Non-interactive package installs
  SKIP_SYSTEM_PACKAGES=1 make setup    Use already-installed system tools
  SKIP_INFRA=1 make setup              Install deps without starting Docker services
EOF
}

main "$@"