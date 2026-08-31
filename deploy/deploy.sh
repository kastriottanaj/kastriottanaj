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

rollback() {
  echo "!! deployment failed — rolling back to ${PREVIOUS:0:8}"
  git reset --hard "$PREVIOUS"
  npm ci --no-audit --no-fund
  npm run build
  sudo systemctl restart "$SERVICE"
  echo "!! rolled back. Check: journalctl -u ${SERVICE} -n 50"
  exit 1
}

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
# Test readability, not just existence: the file is root:deploy 640, and a bare
# -f check passes for a file this user cannot actually open.
if [[ -r /etc/kastriottanaj/env ]]; then
  set -a
  source /etc/kastriottanaj/env
  set +a
else
  echo "  note: /etc/kastriottanaj/env not readable — building without PUBLIC_* vars"
fi
npm run build

log "Restarting ${SERVICE}"
sudo systemctl restart "$SERVICE"

# Give it a moment, then prove it actually came up.
sleep 2
if ! systemctl is-active --quiet "$SERVICE"; then
  rollback
fi

log "Health check"
CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:4321/api/lead \
  -H 'Accept: application/json' -H 'Origin: http://127.0.0.1:4321' || true)"
# 400 is the healthy answer to an empty POST — it means the route is alive and validating.
if [[ "$CODE" == "400" || "$CODE" == "429" ]]; then
  echo "  API responding (HTTP ${CODE})"
else
  echo "!! unexpected API response: HTTP ${CODE}"
  rollback
fi

log "Caddy config"
# This only reports; it never installs. The deploy user's sudoers rule is three
# exact systemctl commands for this service (setup-server.sh), and widening it
# to rewrite /etc/caddy would let anyone who reaches CI re-point the site.
#
# Reporting is the part that was missing: deploy/Caddyfile is installed by
# setup-server.sh at provisioning and by nothing afterwards, so an edit to it
# rides along in the checkout and quietly never takes effect. That silently
# dropped two changes before it was noticed on 2026-08-31.
CADDY_LIVE="/etc/caddy/Caddyfile"
CADDY_REPO="${APP_ROOT}/deploy/Caddyfile"
if [[ ! -r "$CADDY_LIVE" ]]; then
  echo "  note: ${CADDY_LIVE} not readable — skipping drift check"
elif diff -q "$CADDY_LIVE" "$CADDY_REPO" >/dev/null; then
  echo "  matches deploy/Caddyfile"
else
  echo "!! ${CADDY_LIVE} DIFFERS from deploy/Caddyfile — the repo version is NOT live."
  diff "$CADDY_LIVE" "$CADDY_REPO" | sed 's/^/     /'
  echo
  echo "   Install it as root:"
  echo "     cp -a ${CADDY_LIVE} ${CADDY_LIVE}.bak.\$(date +%Y%m%d-%H%M%S)"
  echo "     install -m 644 ${CADDY_REPO} ${CADDY_LIVE}"
  echo "     caddy validate --config ${CADDY_LIVE} --adapter caddyfile && systemctl reload caddy"
fi

log "Deployed $(git rev-parse --short HEAD)"
