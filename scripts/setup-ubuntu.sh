#!/usr/bin/env bash
# Ubuntu 26.04 dev workstation setup — Precision 3650 / i9-11900K / 2x RTX A4000
# Complements tune-dev-box.sh (kernel tunables). This script handles:
#   - CUDA toolkit
#   - Ollama (local LLMs across both A4000s)
#   - Modern CLI tools
#   - GNOME desktop polish
#   - Docker daemon config
#   - Snap cleanup
#   - Journald cap
# Idempotent. Run with: sudo bash scripts/setup-ubuntu.sh
set -euo pipefail

[ "$EUID" -eq 0 ] || { echo "run with sudo"; exit 1; }
REAL_USER="${SUDO_USER:-$USER}"
say() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 1. NVMe I/O scheduler — bypass kernel scheduler (NVMe has hardware queues)
# ---------------------------------------------------------------------------
say "Setting NVMe I/O scheduler to none"
for q in /sys/block/nvme*/queue/scheduler; do
  [ -f "$q" ] && echo none > "$q"
done
cat > /etc/udev/rules.d/60-nvme-scheduler.rules <<'EOF'
ACTION=="add|change", KERNEL=="nvme[0-9]*", ATTR{queue/scheduler}="none"
EOF

# ---------------------------------------------------------------------------
# 2. Reclaim stale swap pages
# ---------------------------------------------------------------------------
say "Cycling swap to reclaim stale pages"
if swapon --show --noheadings | grep -q .; then
  swapoff -a && swapon -a
else
  echo "No swap configured — skipping"
fi

# ---------------------------------------------------------------------------
# 3. Snap cleanup — remove retained disabled revisions
# ---------------------------------------------------------------------------
say "Cleaning snap retained revisions"
if command -v snap &>/dev/null; then
  snap set system refresh.retain=2
  snap list --all | awk '/disabled/{print $1, $3}' | while read -r name rev; do
    snap remove "$name" --revision="$rev" 2>/dev/null || true
  done
else
  echo "snap not installed — skipping"
fi

# ---------------------------------------------------------------------------
# 4. Journald — cap at 100M
# ---------------------------------------------------------------------------
say "Capping journald storage"
mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/size.conf <<'EOF'
[Journal]
SystemMaxUse=100M
EOF
systemctl restart systemd-journald

# ---------------------------------------------------------------------------
# 5. Docker daemon — BuildKit default + log rotation
# ---------------------------------------------------------------------------
say "Configuring Docker daemon"
mkdir -p /etc/docker
python3 -c "
import json, pathlib
p = pathlib.Path('/etc/docker/daemon.json')
cfg = json.loads(p.read_text()) if p.exists() and p.stat().st_size > 0 else {}
cfg.setdefault('features', {})['buildkit'] = True
cfg['log-driver'] = 'json-file'
cfg['log-opts'] = {'max-size': '10m', 'max-file': '3'}
p.write_text(json.dumps(cfg, indent=2) + '\n')
"
if systemctl is-active --quiet docker 2>/dev/null; then
  systemctl restart docker
else
  echo "Docker not running — config written, restart manually after install"
fi

# ---------------------------------------------------------------------------
# 6. CUDA Toolkit (driver 595.84 already installed, need dev tools)
# ---------------------------------------------------------------------------
say "Installing CUDA Toolkit"
if ! command -v nvcc &>/dev/null; then
  apt-get update -qq
  apt-get install -y -qq cuda-toolkit-13
  # Paths for the real user
  su - "$REAL_USER" -c "
    grep -q '/usr/local/cuda/bin' ~/.bashrc 2>/dev/null || {
      echo 'export PATH=/usr/local/cuda/bin:\$PATH' >> ~/.bashrc
      echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:\${LD_LIBRARY_PATH:-}' >> ~/.bashrc
    }
  "
  echo "CUDA installed: $(ls /usr/local/cuda*/bin/nvcc 2>/dev/null | head -1)"
else
  echo "nvcc already at $(nvcc --version | tail -1)"
fi

# ---------------------------------------------------------------------------
# 7. Ollama — local LLM inference across 2x A4000 (32 GB VRAM)
# ---------------------------------------------------------------------------
say "Installing Ollama"
if ! command -v ollama &>/dev/null; then
  curl -fsSL https://ollama.com/install.sh | sh
  echo "Pull models later:  ollama pull llama3.1:70b   (fits 2x A4000)"
else
  echo "ollama already installed: $(ollama --version 2>/dev/null)"
fi

# ---------------------------------------------------------------------------
# 8. Modern CLI tools
# ---------------------------------------------------------------------------
say "Installing CLI tools"
apt-get update -qq
apt-get install -y -qq \
  btop htop \
  ripgrep fd-find bat \
  fzf tmux \
  jq curl wget \
  gnome-tweaks gnome-shell-extension-manager \
  ubuntu-restricted-extras

# eza (modern ls) — not in Ubuntu repos
if ! command -v eza &>/dev/null; then
  mkdir -p /etc/apt/keyrings
  if [ ! -f /etc/apt/keyrings/gierens.gpg ]; then
    wget -qO- https://raw.githubusercontent.com/eza-community/eza/main/deb.asc \
      | gpg --dearmor -o /etc/apt/keyrings/gierens.gpg
    echo "deb [signed-by=/etc/apt/keyrings/gierens.gpg] http://deb.gierens.de stable main" \
      > /etc/apt/sources.list.d/gierens.list
    apt-get update -qq
  fi
  apt-get install -y -qq eza
fi

# zoxide (smarter cd)
say "Installing zoxide, starship"
if ! command -v zoxide &>/dev/null; then
  curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh
fi

# starship prompt
if ! command -v starship &>/dev/null; then
  curl -sS https://starship.rs/install.sh | sh -s -- -y
fi

# Wire up shell integrations for the real user
say "Configuring shell for $REAL_USER"
su - "$REAL_USER" -c '
  RC=~/.bashrc
  grep -q "starship init bash" "$RC" 2>/dev/null || echo "eval \"\$(starship init bash)\"" >> "$RC"
  grep -q "zoxide init bash" "$RC" 2>/dev/null || echo "eval \"\$(zoxide init bash)\"" >> "$RC"
  grep -q "fzf/examples/key-bindings" "$RC" 2>/dev/null || {
    [ -f /usr/share/doc/fzf/examples/key-bindings.bash ] && echo "source /usr/share/doc/fzf/examples/key-bindings.bash" >> "$RC"
  }
  # Aliases for renamed packages
  grep -q "alias fd=" "$RC" 2>/dev/null || echo "alias fd=fdfind" >> "$RC"
  grep -q "alias bat=" "$RC" 2>/dev/null || echo "alias bat=batcat" >> "$RC"
'

# ---------------------------------------------------------------------------
# 9. GNOME desktop polish
# ---------------------------------------------------------------------------
say "Configuring GNOME desktop"
su - "$REAL_USER" -c '
  # Night light (reduce eye strain)
  gsettings set org.gnome.settings-daemon.plugins.color night-light-enabled true
  gsettings set org.gnome.settings-daemon.plugins.color night-light-temperature 4000

  # Faster animations
  gsettings set org.gnome.desktop.interface enable-animations true

  # Show weekday in clock
  gsettings set org.gnome.desktop.interface clock-show-weekday true

  # Middle-click paste
  gsettings set org.gnome.desktop.interface gtk-enable-primary-paste true

  # Show battery percentage (if applicable)
  gsettings set org.gnome.desktop.interface show-battery-percentage true 2>/dev/null || true
'

# ---------------------------------------------------------------------------
# 10. Cleanup
# ---------------------------------------------------------------------------
say "Final cleanup"
apt-get autoremove -y --purge
apt-get clean
journalctl --vacuum-size=100M 2>/dev/null || true

say "DONE"
cat <<'EOF'

WHAT WAS INSTALLED / CHANGED:
  ✓ NVMe scheduler → none (was mq-deadline)
  ✓ Stale swap reclaimed
  ✓ Snap retained revisions pruned
  ✓ Journald capped at 100M
  ✓ Docker: BuildKit default + log rotation
  ✓ CUDA Toolkit 13
  ✓ Ollama (local LLM server)
  ✓ CLI: btop htop ripgrep fd bat fzf eza zoxide starship tmux
  ✓ GNOME: tweaks, extension-manager, night light, restricted extras

NEXT STEPS:
  1. Log out and back in (or: source ~/.bashrc)
  2. Pull an LLM:  ollama pull llama3.1:70b
  3. Open Extension Manager → install Blur my Shell, Vitals, Clipboard Indicator
  4. Verify CUDA:  nvcc --version
  5. Verify GPUs in Docker:  docker run --rm --gpus all ubuntu nvidia-smi -L

REVERT:
  nvme scheduler:  rm /etc/udev/rules.d/60-nvme-scheduler.rules
  journald:        rm /etc/systemd/journald.conf.d/size.conf
  docker:          rm /etc/docker/daemon.json && systemctl restart docker
  ollama:          sudo rm -rf /usr/local/bin/ollama /usr/share/ollama
  starship:        rm /usr/local/bin/starship
  cuda:            apt purge cuda-toolkit-13
  night light:     gsettings reset org.gnome.settings-daemon.plugins.color night-light-enabled
EOF
