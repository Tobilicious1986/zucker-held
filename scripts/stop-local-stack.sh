#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${TMPDIR:-/tmp}/zuckerheld-runtime"
BACKEND_PID_FILE="${RUNTIME_DIR}/backend.pid"
FRONTEND_PID_FILE="${RUNTIME_DIR}/frontend.pid"

stop_process() {
  local pid="$1"
  local label="$2"

  if ! kill -0 "${pid}" 2>/dev/null; then
    return 0
  fi

  kill "${pid}" 2>/dev/null || true
  for _ in {1..10}; do
    if ! kill -0 "${pid}" 2>/dev/null; then
      break
    fi
    sleep 1
  done
  if kill -0 "${pid}" 2>/dev/null; then
    kill -9 "${pid}" 2>/dev/null || true
  fi

  echo "[ok] ${label} gestoppt"
}

stop_pid() {
  local pid_file="$1"
  local label="$2"

  if [[ ! -f "${pid_file}" ]]; then
    return 0
  fi

  local pid
  pid="$(cat "${pid_file}")"
  stop_process "${pid}" "${label}"
  rm -f "${pid_file}"
}

stop_port_listener() {
  local port="$1"
  local label="$2"
  local pids

  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "${pids}" ]]; then
    return 0
  fi

  while IFS= read -r pid; do
    [[ -n "${pid}" ]] || continue
    stop_process "${pid}" "${label} (Port ${port})"
  done <<< "${pids}"
}

stop_pid "${FRONTEND_PID_FILE}" "Frontend"
stop_pid "${BACKEND_PID_FILE}" "Backend"
stop_port_listener 3000 "Frontend-Restprozess"
stop_port_listener 8080 "Backend-Restprozess"

cd "${ROOT_DIR}"
docker compose down

echo "[ok] Docker-Services gestoppt"
