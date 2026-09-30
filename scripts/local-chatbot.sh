#!/usr/bin/env bash
# Local AI chatbot stack — Ollama + Open WebUI
# Always-on: both services auto-start on boot via systemd/Docker restart policy.
# Usage:
#   sudo bash scripts/local-chatbot.sh          # first-time setup or update
#   sudo bash scripts/local-chatbot.sh update    # pull latest Open WebUI image
#   sudo bash scripts/local-chatbot.sh status    # check health
#   sudo bash scripts/local-chatbot.sh logs      # tail Open WebUI logs
#   sudo bash scripts/local-chatbot.sh stop      # stop (will restart on reboot)
#   sudo bash scripts/local-chatbot.sh nuke      # remove everything
set -euo pipefail

CONTAINER="open-webui"
IMAGE="ghcr.io/open-webui/open-webui:cuda"
PORT=3100
VOLUME="open-webui"

say() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }
err() { printf '\033[1;31mERR\033[0m %s\n' "$*" >&2; exit 1; }

cmd_status() {
  echo "=== Ollama ==="
  systemctl is-active ollama.service && ollama list 2>/dev/null || echo "not running"
  echo ""
  echo "=== Open WebUI ==="
  docker ps -a --filter "name=$CONTAINER" --format "  Image:   {{.Image}}\n  Status:  {{.Status}}\n  Ports:   {{.Ports}}"
  echo ""
  echo "=== GPU VRAM ==="
  nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader 2>/dev/null || echo "nvidia-smi not available"
  echo ""
  echo "URL: http://localhost:$PORT"
}

cmd_logs() {
  docker logs -f --tail 50 "$CONTAINER"
}

cmd_stop() {
  say "Stopping Open WebUI (will restart on next boot)"
  docker stop "$CONTAINER" 2>/dev/null || true
}

cmd_nuke() {
  say "Removing Open WebUI container and volume"
  docker stop "$CONTAINER" 2>/dev/null || true
  docker rm "$CONTAINER" 2>/dev/null || true
  echo "Volume '$VOLUME' preserved. To delete data: docker volume rm $VOLUME"
}

cmd_update() {
  say "Pulling latest Open WebUI image"
  docker pull "$IMAGE"

  local CURRENT_ID
  CURRENT_ID=$(docker inspect "$CONTAINER" --format '{{.Image}}' 2>/dev/null || echo "none")
  local LATEST_ID
  LATEST_ID=$(docker inspect "$IMAGE" --format '{{.Id}}' 2>/dev/null || echo "unknown")

  if [ "$CURRENT_ID" = "$LATEST_ID" ]; then
    echo "Already on latest image."
    return
  fi

  say "New image available — recreating container"
  docker stop "$CONTAINER" 2>/dev/null || true
  docker rm "$CONTAINER" 2>/dev/null || true
  _create_container
  _cleanup_images
}

_create_container() {
  say "Starting Open WebUI on port $PORT"
  docker run -d \
    --name "$CONTAINER" \
    --restart always \
    --gpus all \
    -p "$PORT":8080 \
    -v "$VOLUME":/app/backend/data \
    -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
    -e WEBUI_AUTH=true \
    --add-host=host.docker.internal:host-gateway \
    "$IMAGE"

  echo "Waiting for healthy..."
  for i in $(seq 1 30); do
    STATUS=$(docker inspect "$CONTAINER" --format '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    [ "$STATUS" = "healthy" ] && break
    sleep 2
  done
  echo "Container status: $(docker inspect "$CONTAINER" --format '{{.State.Health.Status}}' 2>/dev/null)"
  echo "URL: http://localhost:$PORT"
}

_cleanup_images() {
  say "Cleaning up old images"
  docker image prune -f --filter "label=org.opencontainers.image.title=open-webui" 2>/dev/null || true
}

cmd_setup() {
  # 1. Ensure Ollama is enabled on boot
  say "Ensuring Ollama starts on boot"
  systemctl enable ollama.service 2>/dev/null || true
  systemctl is-active ollama.service >/dev/null 2>&1 || systemctl start ollama.service

  # 2. Ensure Ollama multi-GPU config
  mkdir -p /etc/systemd/system/ollama.service.d
  cat > /etc/systemd/system/ollama.service.d/override.conf <<'EOF'
[Service]
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="CUDA_VISIBLE_DEVICES=0,1"
Environment="OLLAMA_MAX_LOADED_MODELS=2"
Environment="OLLAMA_FLASH_ATTENTION=1"
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF
  systemctl daemon-reload
  systemctl restart ollama.service
  echo "Ollama: enabled, multi-GPU, flash attention"

  # 3. Pull essential models if missing
  say "Checking models"
  for model in qwen2.5-coder:32b deepseek-r1:32b nomic-embed-text; do
    if ! ollama list 2>/dev/null | grep -q "$(echo "$model" | cut -d: -f1)"; then
      echo "Pulling $model..."
      ollama pull "$model" &
    else
      echo "  ✓ $model"
    fi
  done
  wait

  # 4. Pull latest image
  say "Pulling Open WebUI image"
  docker pull "$IMAGE"

  # 5. Create or update container
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    local CURRENT_ID
    CURRENT_ID=$(docker inspect "$CONTAINER" --format '{{.Image}}' 2>/dev/null)
    local LATEST_ID
    LATEST_ID=$(docker inspect "$IMAGE" --format '{{.Id}}' 2>/dev/null)

    if [ "$CURRENT_ID" != "$LATEST_ID" ]; then
      say "Upgrading to new image"
      docker stop "$CONTAINER" 2>/dev/null || true
      docker rm "$CONTAINER" 2>/dev/null || true
      _create_container
    else
      # Ensure restart policy is 'always' (not 'unless-stopped')
      docker update --restart always "$CONTAINER" >/dev/null
      docker start "$CONTAINER" 2>/dev/null || true
      echo "Container already running on latest image."
      echo "Updated restart policy to 'always'."
    fi
  else
    _create_container
  fi

  _cleanup_images

  # 6. GPU persistence mode
  nvidia-smi -pm 1 2>/dev/null || true

  say "DONE"
  echo ""
  echo "  Open WebUI:  http://localhost:$PORT"
  echo "  Ollama API:  http://localhost:11434"
  echo ""
  echo "  Both auto-start on boot."
  echo "  Run 'sudo bash $0 update' to upgrade Open WebUI."
  echo "  Run 'sudo bash $0 status' to check health."
}

# ---------------------------------------------------------------------------
case "${1:-setup}" in
  setup)  cmd_setup ;;
  update) cmd_update ;;
  status) cmd_status ;;
  logs)   cmd_logs ;;
  stop)   cmd_stop ;;
  nuke)   cmd_nuke ;;
  *)      echo "Usage: $0 {setup|update|status|logs|stop|nuke}"; exit 1 ;;
esac
