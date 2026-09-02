#!/usr/bin/env bash
#
# One-time provisioning for a fresh Hetzner Cloud box (Ubuntu 24.04, CAX11/ARM).
# Run as root:  bash setup-server.sh
#
# Idempotent — safe to re-run.

set -euo pipefail

DOMAIN="kastriottanaj.com"
APP_USER="deploy"
APP_ROOT="/var/www/kastriottanaj"
REPO="https://github.com/kastriottanaj/kastriottanaj.git"
# What origin is switched to once the box's deploy key is registered — see
# "GitHub deploy key" below for why the fetch must be authenticated.
SSH_REPO="git@github.com:kastriottanaj/kastriottanaj.git"
NODE_MAJOR=24

log() { printf "\n\033[1m==> %s\033[0m\n" "$*"; }

[[ $EUID -eq 0 ]] || { echo "Run as root." >&2; exit 1; }

log "System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git ufw fail2ban unattended-upgrades ca-certificates debian-keyring debian-archive-keyring apt-transport-https

log "Node ${NODE_MAJOR}"
# Node 22.12+ is required by Astro 7; 24 also gives us node:sqlite without a flag.
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi
node -v

log "Caddy"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -qq
  apt-get install -y -qq caddy
fi
caddy version

log "Application user and directories"
id -u "$APP_USER" >/dev/null 2>&1 || adduser --system --group --home "$APP_ROOT" --shell /bin/bash "$APP_USER"
mkdir -p "$APP_ROOT/data" "$APP_ROOT/backups" /etc/kastriottanaj /var/log/caddy
chown -R "$APP_USER:$APP_USER" "$APP_ROOT"
chown caddy:caddy /var/log/caddy

# adduser --system creates the home as 0750, which Caddy (a different user)
# cannot traverse — every request 403s with "permission denied" on dist/client.
# Open traversal on the app root, but keep the lead database private to the
# service user: it must not become readable just because the web server needs
# to reach the build output two directories away.
chmod 755 "$APP_ROOT"
chmod 700 "$APP_ROOT/data" "$APP_ROOT/backups"

log "SSH access for ${APP_USER}"
# CI deploys by SSHing in as this user and running deploy.sh, but
# `adduser --system` leaves it with no authorized_keys at all. Without this
# block the handshake fails with "unable to authenticate, attempted methods
# [none]" before deploy.sh is ever reached — and nothing on the box looks
# wrong, so the cause is easy to miss.
#
# Root's keys are copied across so whoever provisioned the box can also reach
# the deploy user. Pass a dedicated CI key to keep that separate from your
# personal one — it can then be revoked on its own:
#
#   ssh root@<ip> "DEPLOY_SSH_PUB_KEY='$(cat ~/.ssh/kastriottanaj-ci.pub)' bash -s" \
#     < deploy/setup-server.sh
#
SSH_DIR="$APP_ROOT/.ssh"
AUTH_KEYS="$SSH_DIR/authorized_keys"
install -d -m 700 -o "$APP_USER" -g "$APP_USER" "$SSH_DIR"
touch "$AUTH_KEYS"

# Re-running must not stack duplicate lines.
add_key() {
  [[ -n "${1:-}" ]] || return 0
  grep -qxF "$1" "$AUTH_KEYS" || printf '%s\n' "$1" >> "$AUTH_KEYS"
}

if [[ -f /root/.ssh/authorized_keys ]]; then
  while IFS= read -r line; do
    [[ -n "${line// }" && "$line" != \#* ]] && add_key "$line"
  done < /root/.ssh/authorized_keys
fi
add_key "${DEPLOY_SSH_PUB_KEY:-}"

chown "$APP_USER:$APP_USER" "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"
echo "  $(grep -c . "$AUTH_KEYS") key(s) authorized for ${APP_USER}"

log "Secrets file"
if [[ ! -f /etc/kastriottanaj/env ]]; then
  cat > /etc/kastriottanaj/env <<'EOF'
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=kastriot@kastriottanaj.com
SMTP_PASSWORD=
LEAD_TO_EMAIL=kastriot@kastriottanaj.com
# TURNSTILE_SECRET_KEY=
EOF
  echo "  created /etc/kastriottanaj/env — FILL THIS IN before the form can send mail"
fi
# root:deploy 640 — the build needs to read PUBLIC_* vars from here. This is not
# a real widening: the service runs as deploy, so that user's processes already
# carry these values in their environment at runtime.
chown root:"$APP_USER" /etc/kastriottanaj/env
chmod 640 /etc/kastriottanaj/env

log "Clone"
if [[ ! -d "$APP_ROOT/current/.git" ]]; then
  sudo -u "$APP_USER" git clone "$REPO" "$APP_ROOT/current"
else
  echo "  already cloned"
fi

log "GitHub deploy key"
# Every deploy fetches, and GitHub throttles ANONYMOUS git traffic from this
# address: on 2026-09-02 the anonymous `git-upload-pack` POST came back 401
# about half the time and failed the deploy. An authenticated fetch is not
# throttled that way, so the box gets its own read-only deploy key.
#
# The clone above still runs over HTTPS on purpose — it happens before any key
# exists. Everything after it goes over SSH.
KEY="$APP_ROOT/.ssh/github-deploy"
sudo -u "$APP_USER" mkdir -p "$APP_ROOT/.ssh"
sudo -u "$APP_USER" chmod 700 "$APP_ROOT/.ssh"
if [[ ! -f "$KEY" ]]; then
  sudo -u "$APP_USER" ssh-keygen -t ed25519 -N "" \
    -C "${APP_USER}@$(hostname) (github read-only)" -f "$KEY" >/dev/null
  echo "  generated ${KEY}"
else
  echo "  key already present"
fi
if ! sudo -u "$APP_USER" grep -q "github-deploy" "$APP_ROOT/.ssh/config" 2>/dev/null; then
  # IdentitiesOnly so this key is the only one offered to GitHub.
  printf '\nHost github.com\n  IdentityFile %s\n  IdentitiesOnly yes\n' "$KEY" \
    | sudo -u "$APP_USER" tee -a "$APP_ROOT/.ssh/config" >/dev/null
  sudo -u "$APP_USER" chmod 600 "$APP_ROOT/.ssh/config"
fi
# The deploy runs non-interactively, so the host key must already be trusted.
if ! sudo -u "$APP_USER" ssh-keygen -F github.com >/dev/null 2>&1; then
  ssh-keyscan -t rsa,ecdsa,ed25519 github.com 2>/dev/null \
    | sudo -u "$APP_USER" tee -a "$APP_ROOT/.ssh/known_hosts" >/dev/null
fi

if sudo -u "$APP_USER" ssh -o BatchMode=yes -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  sudo -u "$APP_USER" git -C "$APP_ROOT/current" remote set-url origin "$SSH_REPO"
  echo "  origin -> ${SSH_REPO}"
else
  echo
  echo "  !! This key is not registered on the repo yet, so origin stays on HTTPS"
  echo "     and deploys will hit the anonymous-throttling 401 described above."
  echo
  echo "     Register it as a READ-ONLY deploy key, then re-run this script:"
  echo
  sed 's/^/       /' "${KEY}.pub"
  echo
  echo "       gh repo deploy-key add <that key> --title '$(hostname)'   # run locally"
  echo
fi

log "Deploy user sudo rights"
# deploy.sh restarts the service after building. Grant exactly that and nothing
# else — no blanket NOPASSWD:ALL.
cat > /etc/sudoers.d/kastriottanaj-deploy <<'EOF'
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart kastriottanaj, \
                            /usr/bin/systemctl is-active kastriottanaj, \
                            /usr/bin/systemctl status kastriottanaj
EOF
chmod 440 /etc/sudoers.d/kastriottanaj-deploy
visudo -cf /etc/sudoers.d/kastriottanaj-deploy || { rm -f /etc/sudoers.d/kastriottanaj-deploy; echo "sudoers rule invalid"; exit 1; }

# Root and deploy both touch this checkout; without this git refuses to operate.
git config --global --add safe.directory "$APP_ROOT/current" 2>/dev/null || true

log "Firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

log "Unattended upgrades + fail2ban"
systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

log "Service units"
install -m 644 "$APP_ROOT/current/deploy/kastriottanaj.service" /etc/systemd/system/kastriottanaj.service
install -m 644 "$APP_ROOT/current/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl daemon-reload

log "Nightly database backup"
install -m 755 "$APP_ROOT/current/deploy/backup-leads.sh" /usr/local/bin/backup-leads.sh
cat > /etc/cron.d/kastriottanaj-backup <<EOF
15 3 * * * ${APP_USER} /usr/local/bin/backup-leads.sh >> /var/log/lead-backup.log 2>&1
EOF

cat <<EOF

────────────────────────────────────────────────────────────────────────
Provisioned. Remaining steps, in order:

  1. Point DNS at this box:
       A     ${DOMAIN}       -> $(curl -s4 ifconfig.me || echo '<server IP>')
       A     www.${DOMAIN}   -> same
     (If you put Cloudflare in front, set those records to "Proxied".)

  2. Fill in SMTP_PASSWORD in /etc/kastriottanaj/env.

  3. First deploy:
       sudo -u ${APP_USER} ${APP_ROOT}/current/deploy/deploy.sh

  4. Start everything:
       systemctl enable --now kastriottanaj
       systemctl reload caddy

Caddy will obtain the TLS certificate on the first request once DNS resolves.
────────────────────────────────────────────────────────────────────────
EOF
