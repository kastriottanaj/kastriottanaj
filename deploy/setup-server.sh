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

log "Secrets file"
if [[ ! -f /etc/kastriottanaj/env ]]; then
  cat > /etc/kastriottanaj/env <<'EOF'
RESEND_API_KEY=
LEAD_FROM_EMAIL=leads@kastriottanaj.com
LEAD_TO_EMAIL=
# TURNSTILE_SECRET_KEY=
EOF
  echo "  created /etc/kastriottanaj/env — FILL THIS IN before the form can send mail"
fi
chmod 600 /etc/kastriottanaj/env
chown root:root /etc/kastriottanaj/env

log "Clone"
if [[ ! -d "$APP_ROOT/current/.git" ]]; then
  sudo -u "$APP_USER" git clone "$REPO" "$APP_ROOT/current"
else
  echo "  already cloned"
fi

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

  2. Fill in /etc/kastriottanaj/env  (RESEND_API_KEY, LEAD_TO_EMAIL).

  3. First deploy:
       sudo -u ${APP_USER} ${APP_ROOT}/current/deploy/deploy.sh

  4. Start everything:
       systemctl enable --now kastriottanaj
       systemctl reload caddy

Caddy will obtain the TLS certificate on the first request once DNS resolves.
────────────────────────────────────────────────────────────────────────
EOF
