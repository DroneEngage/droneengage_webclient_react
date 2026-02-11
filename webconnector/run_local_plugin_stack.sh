#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CADDYFILE="${SCRIPT_DIR}/Caddyfile.localplugin"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is not installed or not in PATH" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed or not in PATH" >&2
  exit 1
fi

if ! command -v caddy >/dev/null 2>&1; then
  echo "ERROR: caddy is not installed or not in PATH" >&2
  exit 1
fi

if [[ ! -f "${CADDYFILE}" ]]; then
  echo "ERROR: Missing Caddyfile: ${CADDYFILE}" >&2
  exit 1
fi

port_in_use() {
  local p="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${p}" -sTCP:LISTEN -n -P >/dev/null 2>&1
    return $?
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -E ":${p}$" >/dev/null 2>&1
    return $?
  fi

  return 1
}

show_port_owner() {
  local p="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${p}" -sTCP:LISTEN -n -P || true
  else
    echo "(lsof not found; install lsof for better diagnostics)" >&2
  fi
}

for p in 9211 9212 9443; do
  if port_in_use "${p}"; then
    echo "ERROR: port ${p} is already in use." >&2
    show_port_owner "${p}" >&2
    echo "Hint: stop the process using the port, then re-run this script." >&2
    exit 1
  fi
done

WEBCONNECTOR_PID=""
CADDY_PID=""

cleanup() {
  set +e

  if [[ -n "${CADDY_PID}" ]] && kill -0 "${CADDY_PID}" >/dev/null 2>&1; then
    kill "${CADDY_PID}" >/dev/null 2>&1
  fi

  if [[ -n "${WEBCONNECTOR_PID}" ]] && kill -0 "${WEBCONNECTOR_PID}" >/dev/null 2>&1; then
    kill "${WEBCONNECTOR_PID}" >/dev/null 2>&1
  fi

  wait >/dev/null 2>&1
}

trap cleanup EXIT INT TERM

echo "Starting WebConnector (local HTTP+WS)..."
(
  cd "${SCRIPT_DIR}"
  npm start
) &
WEBCONNECTOR_PID=$!

echo "Starting Caddy reverse proxy (HTTPS/WSS on :9443)..."
(
  cd "${SCRIPT_DIR}"
  caddy run --config "${CADDYFILE}" --adapter caddyfile
) &
CADDY_PID=$!

echo ""
echo "Running:"
echo "- WebConnector: http://127.0.0.1:9211  (API)"
echo "- WebConnector: ws://127.0.0.1:9212    (WS)"
echo "- Caddy proxy:  https://localhost:9443/api  -> 9211"
echo "- Caddy proxy:  wss://localhost:9443      -> 9212"
echo ""
echo "PIDs: webconnector=${WEBCONNECTOR_PID} caddy=${CADDY_PID}"
echo "Press Ctrl+C to stop both."
echo ""

wait "${WEBCONNECTOR_PID}" "${CADDY_PID}"
