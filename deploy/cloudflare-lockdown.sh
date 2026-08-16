#!/usr/bin/env bash
#
# Restricts the origin's 80/443 to Cloudflare's published IP ranges.
#
#   bash deploy/cloudflare-lockdown.sh <server-ip>
#
# Run this ONLY after both DNS records are proxied (orange cloud) and the site
# serves correctly — it makes the box unreachable on 80/443 from anywhere else.
#
# Why it matters: the app trusts CF-Connecting-IP to identify visitors for rate
# limiting. That header is only trustworthy if Cloudflare is the sole thing that
# can reach the origin. Without this, anyone who learns the IP can bypass the
# proxy and forge the header.
#
# SSH (22) stays open so you never lock yourself out.

set -euo pipefail

SERVER_IP="${1:-}"
[[ -n "$SERVER_IP" ]] || { echo "Usage: $0 <server-ip>" >&2; exit 1; }

TOKEN_FILE="${HCLOUD_TOKEN_FILE:-$HOME/.config/hcloud/token}"
API="https://api.hetzner.cloud/v1"
FIREWALL_NAME="kastriottanaj-web-fw"

[[ -s "$TOKEN_FILE" ]] || { echo "No token at ${TOKEN_FILE}" >&2; exit 1; }
TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"

log() { printf "\n\033[1m==> %s\033[0m\n" "$*"; }

log "Fetching Cloudflare IP ranges"
V4="$(curl -sS https://www.cloudflare.com/ips-v4)"
V6="$(curl -sS https://www.cloudflare.com/ips-v6)"
[[ -n "$V4" && -n "$V6" ]] || { echo "Could not fetch Cloudflare ranges" >&2; exit 1; }
echo "  $(echo "$V4" | wc -l | tr -d ' ') IPv4 + $(echo "$V6" | wc -l | tr -d ' ') IPv6 ranges"

CF_IPS="$(printf '%s\n%s\n' "$V4" "$V6" | grep -v '^$' | jq -R . | jq -s .)"

log "Confirming the site works through Cloudflare first"
CODE="$(curl -sS -o /dev/null -w '%{http_code}' https://kastriottanaj.com/ || echo 000)"
if [[ "$CODE" != "200" ]]; then
  echo "!! https://kastriottanaj.com returned ${CODE}, expected 200."
  echo "!! Fix that before locking the origin down, or you will be debugging blind."
  exit 1
fi
echo "  site responding 200"

log "Updating firewall '${FIREWALL_NAME}'"
FIREWALL_ID="$(curl -sS "${API}/firewalls?name=${FIREWALL_NAME}" \
  -H "Authorization: Bearer ${TOKEN}" | jq -r '.firewalls[0].id // empty')"
[[ -n "$FIREWALL_ID" ]] || { echo "Firewall ${FIREWALL_NAME} not found" >&2; exit 1; }

RULES="$(jq -n --argjson cf "$CF_IPS" '{
  rules: [
    { direction: "in", protocol: "tcp", port: "22",  source_ips: ["0.0.0.0/0", "::/0"], description: "SSH" },
    { direction: "in", protocol: "tcp", port: "80",  source_ips: $cf, description: "HTTP from Cloudflare only" },
    { direction: "in", protocol: "tcp", port: "443", source_ips: $cf, description: "HTTPS from Cloudflare only" },
    { direction: "in", protocol: "icmp", source_ips: ["0.0.0.0/0", "::/0"], description: "ping" }
  ]
}')"

RESULT="$(curl -sS -X POST "${API}/firewalls/${FIREWALL_ID}/actions/set_rules" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "$RULES")"

if echo "$RESULT" | jq -e '.error' >/dev/null 2>&1; then
  echo "!! $(echo "$RESULT" | jq -r '.error.message')" >&2
  exit 1
fi

log "Verifying"
sleep 5
DIRECT="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 8 "http://${SERVER_IP}/" || echo 000)"
PROXIED="$(curl -sS -o /dev/null -w '%{http_code}' https://kastriottanaj.com/ || echo 000)"
echo "  direct to origin : ${DIRECT}  (000 or timeout = correctly blocked)"
echo "  through Cloudflare: ${PROXIED}  (200 = still working)"

if [[ "$PROXIED" != "200" ]]; then
  echo
  echo "!! The site stopped responding through Cloudflare. Revert with:"
  echo "!!   bash deploy/provision-hetzner.sh   # recreates the open ruleset"
  exit 1
fi

log "Origin locked to Cloudflare"
echo "Cloudflare's ranges change occasionally — re-run this script after they do."
