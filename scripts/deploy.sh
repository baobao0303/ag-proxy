#!/bin/bash
# Deploy the image that GitHub Actions built and pushed to GHCR.
#
# This is the script the real deploy job runs, kept in the repo so the logic is
# reviewable and testable outside Jenkins. `Jenkinsfile` calls this file, and the
# server's FreeStyle job runs the same body.
#
# Required on the host:
#   /data/server/compose.yml     the server's compose file
#   /data/server/ag-proxy.env    app env (must not be committed)
#   /data/server/.ghcr-token     registry token, mode 644 so the job can read it
#
# Environment:
#   IMAGE_TAG   tag to deploy, default latest
#   DOCKER_HOST unix:///run/user/1000/docker.sock on a rootless host
set -euo pipefail

export DOCKER_HOST="${DOCKER_HOST:-unix:///var/run/docker.sock}"

REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE="${IMAGE:-ghcr.io/baobao0303/ag-proxy}"
TAG="${IMAGE_TAG:-latest}"
COMPOSE_FILE="${COMPOSE_FILE:-/data/server/compose.yml}"
ENV_FILE="${ENV_FILE:-/data/server/ag-proxy.env}"
TOKEN_FILE="${TOKEN_FILE:-/data/server/.ghcr-token}"
REGISTRY_USER="${REGISTRY_USER:-baobao0303}"

log() { echo "[deploy] $*"; }
fail() { echo "[deploy] FAIL: $*" >&2; exit 1; }

# --- preflight ---------------------------------------------------------------
# Fail before touching the running container, so a misconfigured deploy cannot
# take production down on its way to failing.
[ -f "$COMPOSE_FILE" ] || fail "missing $COMPOSE_FILE"
[ -f "$ENV_FILE" ]     || fail "missing $ENV_FILE"
[ -f "$TOKEN_FILE" ]   || fail "missing $TOKEN_FILE (write the GHCR token there, chmod 644)"

for v in FLOCI_ENDPOINT AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY JWT_SECRET; do
  grep -q "^$v=" "$ENV_FILE" || fail "missing $v in $ENV_FILE"
done
log "preflight ok"

# --- pull --------------------------------------------------------------------
cat "$TOKEN_FILE" | docker login "$REGISTRY" -u "$REGISTRY_USER" --password-stdin >/dev/null
docker pull "$IMAGE:$TAG"
docker inspect --format '{{.Id}}' "$IMAGE:$TAG" > /tmp/ag-image-id
log "pulled $IMAGE:$TAG -> $(cat /tmp/ag-image-id)"

# --- deploy ------------------------------------------------------------------
# --no-build because the image comes from the registry, not from this checkout.
# --force-recreate because a plain restart keeps the previous container.
IMAGE_TAG="$TAG" docker compose -f "$COMPOSE_FILE" up -d --no-build --force-recreate ag-proxy

# --- health check ------------------------------------------------------------
# A running container proves nothing: it can be crash-looping. Wait for a real
# HTTP 200.
#
# The probe target is discovered at run time rather than assumed. `ag-proxy:5032`
# only resolves inside the Docker network (true when this runs from the Jenkins
# container, which shares it) and not from the host shell, where the published
# port is the way in. Candidates are tried on every poll, because right after a
# recreate the app is not up yet and the first probe would otherwise pick a dead
# target and keep it for the rest of the loop.
candidates=("http://ag-proxy:5032/api/setup/status" "http://127.0.0.1:5032/api/setup/status")
[ -n "${HEALTH_URL:-}" ] && candidates=("$HEALTH_URL")

for i in $(seq 1 40); do
  code=""
  for candidate in "${candidates[@]}"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$candidate" || true)
    if [ "$code" = "200" ]; then
      HEALTH_URL="$candidate"
      break
    fi
  done
  if [ "$code" = "200" ]; then
    log "READY: $HEALTH_URL 200"
    running=$(docker inspect ag-proxy --format '{{.Image}}')
    if [ "$running" != "$(cat /tmp/ag-image-id)" ]; then
      fail "container is running $running, expected $(cat /tmp/ag-image-id)"
    fi
    docker image prune -f >/dev/null 2>&1 || true
    log "DEPLOY_OK"
    exit 0
  fi
  sleep 3
done

log "no 200 on $HEALTH_URL after 120s"
docker compose -f "$COMPOSE_FILE" logs --tail 60 ag-proxy || true
exit 1
