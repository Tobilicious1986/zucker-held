#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${TMPDIR:-/tmp}/zuckerheld-runtime"
BACKEND_PID_FILE="${RUNTIME_DIR}/backend.pid"
FRONTEND_PID_FILE="${RUNTIME_DIR}/frontend.pid"
BACKEND_LOG="${RUNTIME_DIR}/backend.log"
FRONTEND_LOG="${RUNTIME_DIR}/frontend.log"
SMOKE_PROFILE_NAME="${ZUCKERHELD_SMOKE_PROFILE_NAME:-Stack Smoke}"
SMOKE_EMAIL="${ZUCKERHELD_SMOKE_EMAIL:-stack-smoke@zuckerheld.local}"
SMOKE_PASSWORD="${ZUCKERHELD_SMOKE_PASSWORD:-Smoke1234!}"
STACK_STARTED=0

mkdir -p "${RUNTIME_DIR}"

log() {
  echo "[info] $*"
}

extract_profile_id() {
  local json="$1"
  printf '%s' "${json}" | sed -n 's/.*"profile":{"id":"\([^"]*\)".*/\1/p'
}

cleanup_on_error() {
  local exit_code="$1"
  trap - ERR

  if [[ "${STACK_STARTED}" == "1" ]]; then
    echo "[fehler] Start fehlgeschlagen, räume halben Stack auf" >&2
    "${ROOT_DIR}/scripts/stop-local-stack.sh" >/dev/null 2>&1 || true
  fi

  exit "${exit_code}"
}

find_profile_id_by_name() {
  local name="$1"
  local profiles_json

  profiles_json="$(curl --silent --fail "http://127.0.0.1:8080/api/v1/profiles")"
  printf '%s' "${profiles_json}" \
    | tr '{' '\n' \
    | grep -F "\"name\":\"${name}\"" \
    | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' \
    | head -n 1
}

ensure_login_smoke() {
  local profile_id=""
  profile_id="$(find_profile_id_by_name "${SMOKE_PROFILE_NAME}" || true)"

  if [[ -z "${profile_id}" ]]; then
    log "Lege lokales Smoke-Profil für den Login-Check an"

    local register_body
    register_body="$(mktemp)"
    local register_status
    register_status="$(
      curl --silent --show-error \
        --output "${register_body}" \
        --write-out '%{http_code}' \
        -X POST "http://127.0.0.1:8080/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${SMOKE_EMAIL}\",\"name\":\"${SMOKE_PROFILE_NAME}\",\"password\":\"${SMOKE_PASSWORD}\",\"type\":\"erwachsen\",\"avatar\":\"S\"}"
    )"

    local register_response
    register_response="$(cat "${register_body}" 2>/dev/null || true)"

    if [[ "${register_status}" != "201" && "${register_status}" != "409" ]]; then
      cat "${register_body}" >&2 || true
      rm -f "${register_body}"
      echo "[fehler] Smoke-Registrierung fehlgeschlagen (${register_status})" >&2
      return 1
    fi

    if [[ "${register_status}" == "201" ]]; then
      profile_id="$(extract_profile_id "${register_response}")"
    fi

    rm -f "${register_body}"
    if [[ -z "${profile_id}" ]]; then
      profile_id="$(find_profile_id_by_name "${SMOKE_PROFILE_NAME}" || true)"
    fi
  fi

  if [[ -z "${profile_id}" ]]; then
    log "Vorhandenes Smoke-Profil nicht auffindbar, lege einen einmaligen Fallback-Account an"

    local suffix
    suffix="$(date +%s)"
    local fallback_name="${SMOKE_PROFILE_NAME} ${suffix}"
    local fallback_email="stack-smoke-${suffix}@zuckerheld.local"
    local register_body
    register_body="$(mktemp)"
    local register_status
    register_status="$(
      curl --silent --show-error \
        --output "${register_body}" \
        --write-out '%{http_code}' \
        -X POST "http://127.0.0.1:8080/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${fallback_email}\",\"name\":\"${fallback_name}\",\"password\":\"${SMOKE_PASSWORD}\",\"type\":\"erwachsen\",\"avatar\":\"S\"}"
    )"

    local register_response
    register_response="$(cat "${register_body}" 2>/dev/null || true)"
    rm -f "${register_body}"

    if [[ "${register_status}" != "201" ]]; then
      printf '%s\n' "${register_response}" >&2
      echo "[fehler] Fallback-Smoke-Registrierung fehlgeschlagen (${register_status})" >&2
      return 1
    fi

    profile_id="$(extract_profile_id "${register_response}")"
  fi

  if [[ -z "${profile_id}" ]]; then
    echo "[fehler] Smoke-Profil für Login-Check konnte nicht gefunden werden" >&2
    return 1
  fi

  local login_body
  login_body="$(mktemp)"
  local login_status
  login_status="$(
    curl --silent --show-error \
      --output "${login_body}" \
      --write-out '%{http_code}' \
      -X POST "http://127.0.0.1:8080/api/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"profileId\":\"${profile_id}\"}"
  )"

  if [[ "${login_status}" != "200" ]]; then
    cat "${login_body}" >&2 || true
    rm -f "${login_body}"
    echo "[fehler] Login-Smoke-Test fehlgeschlagen (${login_status})" >&2
    return 1
  fi

  rm -f "${login_body}"
  echo "[ok] Login-Smoke-Test erfolgreich (${profile_id})"
}

ensure_port_available() {
  local port="$1"
  local label="$2"
  local pid

  pid="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
  if [[ -n "${pid}" ]]; then
    echo "[fehler] ${label}-Port ${port} ist bereits belegt (PID ${pid}). Bitte zuerst ./scripts/stop-local-stack.sh ausführen." >&2
    return 1
  fi
}

start_bg() {
  local pid_file="$1"
  local log_file="$2"
  local workdir="$3"
  shift 3

  if [[ -f "${pid_file}" ]]; then
    local existing_pid
    existing_pid="$(cat "${pid_file}")"
    if kill -0 "${existing_pid}" 2>/dev/null; then
      return 0
    fi
    rm -f "${pid_file}"
  fi

  : >"${log_file}"

  (
    cd "${workdir}"
    exec nohup "$@" >"${log_file}" 2>&1 < /dev/null
  ) &

  echo $! >"${pid_file}"
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local tries="${3:-60}"

  for ((i=1; i<=tries; i++)); do
    if curl --silent --fail "${url}" >/dev/null 2>&1; then
      echo "[ok] ${label}: ${url}"
      return 0
    fi
    sleep 2
  done

  echo "[fehler] ${label} wurde nicht rechtzeitig erreichbar: ${url}" >&2
  return 1
}

wait_for_postgres() {
  local tries="${1:-60}"

  for ((i=1; i<=tries; i++)); do
    if docker compose exec -T postgres pg_isready -U zuckerheld -d postgres >/dev/null 2>&1; then
      echo "[ok] Postgres ist bereit"
      return 0
    fi
    sleep 2
  done

  echo "[fehler] Postgres wurde nicht rechtzeitig bereit" >&2
  return 1
}

ensure_keycloak_database() {
  local exists
  exists="$(
    docker compose exec -T postgres \
      psql -U zuckerheld -d postgres -tAc \
      "SELECT 1 FROM pg_database WHERE datname = 'keycloak';" 2>/dev/null || true
  )"

  if [[ "${exists}" == "1" ]]; then
    echo "[ok] Keycloak-Datenbank existiert bereits"
    return 0
  fi

  log "Keycloak-Datenbank fehlt auf bestehendem Volume und wird angelegt"
  docker compose exec -T postgres \
    psql -U zuckerheld -d postgres \
    -c "CREATE DATABASE keycloak;"
  echo "[ok] Keycloak-Datenbank angelegt"
}

wait_for_keycloak() {
  wait_for_url \
    "http://127.0.0.1:8180/realms/zuckerheld/.well-known/openid-configuration" \
    "Keycloak" \
    "${1:-90}"
}

trap 'cleanup_on_error $?' ERR

cd "${ROOT_DIR}"
log "Starte Postgres"
docker compose up -d postgres
STACK_STARTED=1
wait_for_postgres 60
ensure_keycloak_database

log "Starte RabbitMQ und Keycloak"
docker compose up -d rabbitmq keycloak
wait_for_keycloak 120

ensure_port_available 8080 "Backend"
ensure_port_available 3000 "Frontend"

log "Starte Backend"
start_bg "${BACKEND_PID_FILE}" "${BACKEND_LOG}" "${ROOT_DIR}/backend" mvn spring-boot:run
log "Starte Frontend"
start_bg "${FRONTEND_PID_FILE}" "${FRONTEND_LOG}" "${ROOT_DIR}/frontend" npm run dev -- --hostname 0.0.0.0 --port 3000

wait_for_url "http://127.0.0.1:8080/actuator/health" "Backend" 180
wait_for_url "http://127.0.0.1:3000/login" "Frontend"
wait_for_url "http://127.0.0.1:3000/api/v1/profiles" "Frontend API-Bridge" 90
ensure_login_smoke
trap - ERR

echo
echo "Zucker-Held lokal gestartet."
echo "- Frontend: http://127.0.0.1:3000/login"
echo "- Backend:  http://127.0.0.1:8080/actuator/health"
echo "- Keycloak: http://127.0.0.1:8180"
echo "- Logs:     ${RUNTIME_DIR}"
