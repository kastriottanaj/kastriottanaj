#!/usr/bin/env bash
#
# Deploy: pull, install, build, restart. Run as the deploy user on the server.
#
#   sudo -u deploy /var/www/kastriottanaj/current/deploy/deploy.sh
#
# The build runs here rather than in CI on purpose: the box is ARM64, and
# building on the same architecture that runs it removes a whole class of
# "works on the runner" failures.

set -euo pipefail

APP_ROOT="/var/www/kastriottanaj/current"
BRANCH="${DEPLOY_BRANCH:-main}"
SERVICE="kastriottanaj"

log() { printf "\n\033[1m==> %s\033[0m\n" "$*"; }

cd "$APP_ROOT"

log "Fetching ${BRANCH}"
git fetch --prune origin
PREVIOUS="$(git rev-parse HEAD)"
git reset --hard "origin/${BRANCH}"
echo "  ${PREVIOUS:0:8} -> $(git rev-parse --short HEAD)"

log "Dependencies"
npm ci --no-audit --no-fund

log "Building"
# PUBLIC_* vars are baked into the HTML, so they must be present at build time.
set -a
[[ -f /etc/kastriottanaj/env ]] && source /etc/kastriottanaj/env
set +a
npm run build

log "Restarting ${SERVICE}"
sudo systemctl restart "$SERVICE"

# Give it a moment, then prove it actually came up.
sleep 2
if ! systemctl is-active --quiet "$SERVICE"; then
  echo "!! ${SERVICE} failed to start — rolling back to ${PREVIOUS:0:8}"
  git reset --hard "$PREVIOUS"
  npm ci --no-audit --no-fund
  npm run build
  sudo systemctl restart "$SERVICE"
  echo "!! rolled back. Check: journalctl -u ${SERVICE} -n 50"
  exit 1
fi

log "Health check"
CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:4321/api/lead \
  -H 'Accept: application/json' -H 'Origin: http://127.0.0.1:4321' || true)"
# 400 is the healthy answer to an empty POST — it means the route is alive and validating.
if [[ "$CODE" == "400" || "$CODE" == "429" ]]; then
  echo "  API responding (HTTP ${CODE})"
else
  echo "  ! unexpected API response: HTTP ${CODE} — check journalctl -u ${SERVICE}"
fi

log "Deployed $(git rev-parse --short HEAD)"
