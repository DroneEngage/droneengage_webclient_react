#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "ERROR: run as root (sudo)" >&2
  exit 1
fi

if command -v caddy >/dev/null 2>&1; then
  echo "Caddy already installed: $(caddy version 2>/dev/null || true)"
else
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update
    apt-get install -y caddy
  else
    echo "ERROR: unsupported distro (no apt-get). Install Caddy manually from https://caddyserver.com/docs/install" >&2
    exit 2
  fi
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl disable --now caddy >/dev/null 2>&1 || true
fi

echo "OK: caddy installed. system service disabled."
