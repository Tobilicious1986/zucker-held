#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${TMPDIR:-/tmp}/zuckerheld-runtime"
BACKEND_PID_FILE="${RUNTIME_DIR}/backend.pid"
FRONTEND_PID_FILE="${RUNTIME_DIR}/frontend.pid"

DOCKER_BIN="${DOCKER_BIN:-}"
DOCKER_CONFIG_DIR=""

resolve_docker_bin() {
  if [[ -n "${DOCKER_BIN}" && -x "${DOCKER_BIN}" ]]; then
    return 0
  fi

  local candidates=()
  local path_docker
  path_docker="$(type -P docker 2>/dev/null || true)"
  if [[ -n "${path_docker}" ]]; then
    candidates+=("${path_docker}")
  fi

  candidates+=(
    "/Applications/Docker.app/Contents/Resources/bin/docker"
    "${HOME}/Applications/Docker.app/Contents/Resources/bin/docker"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -x "${candidate}" ]]; then
      DOCKER_BIN="${candidate}"
      return 0
    fi
  done

  return 1
}

docker_cli() {
  if [[ -n "${DOCKER_CONFIG_DIR}" ]]; then
    DOCKER_CONFIG="${DOCKER_CONFIG_DIR}" "${DOCKER_BIN}" "$@"
  else
    "${DOCKER_BIN}" "$@"
  fi
}

ensure_docker_cli_plugins() {
  if docker_cli compose version >/dev/null 2>&1; then
    return 0
  fi

  local resources_dir
  resources_dir="$(cd "$(dirname "${DOCKER_BIN}")/.." && pwd)"
  local compose_plugin="${resources_dir}/cli-plugins/docker-compose"
  if [[ ! -x "${compose_plugin}" ]]; then
    return 1
  fi

  DOCKER_CONFIG_DIR="${RUNTIME_DIR}/docker-cli-config"
  mkdir -p "${DOCKER_CONFIG_DIR}/cli-plugins"
  ln -sf "${compose_plugin}" "${DOCKER_CONFIG_DIR}/cli-plugins/docker-compose"
}

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

stop_screen_session() {
  local session_name="$1"
  local label="$2"

  if ! command -v screen >/dev/null 2>&1; then
    return 0
  fi

  if screen -ls 2>/dev/null | grep -F ".${session_name}" >/dev/null 2>&1; then
    screen -S "${session_name}" -X quit >/dev/null 2>&1 || true
    echo "[ok] ${label}-Screen gestoppt"
  fi
}

stop_pid "${FRONTEND_PID_FILE}" "Frontend"
stop_pid "${BACKEND_PID_FILE}" "Backend"
stop_screen_session "zuckerheld-frontend" "Frontend"
stop_screen_session "zuckerheld-backend" "Backend"
stop_port_listener 3000 "Frontend-Restprozess"
stop_port_listener 8080 "Backend-Restprozess"

cd "${ROOT_DIR}"
if resolve_docker_bin && ensure_docker_cli_plugins; then
  docker_cli compose down
  echo "[ok] Docker-Services gestoppt"
else
  echo "[info] Docker nicht gefunden; lokale Backend-/Frontend-Prozesse wurden geprueft."
fi
