#!/usr/bin/env bash
#
# Creates the Hetzner Cloud server for kastriottanaj.com.
#
#   bash deploy/provision-hetzner.sh
#
# Reads the API token from ~/.config/hcloud/token (chmod 600). The token is
# never printed, never passed as an argument, and never written to a log.
#
# Idempotent: re-running finds the existing SSH key, firewall and server by name
# instead of creating duplicates.

set -euo pipefail

TOKEN_FILE="${HCLOUD_TOKEN_FILE:-$HOME/.config/hcloud/token}"
API="https://api.hetzner.cloud/v1"

SERVER_NAME="kastriottanaj-web"
SERVER_TYPE="cx23"       # 2 vCPU x86, 4GB RAM, 40GB NVMe
ARCH="x86"
LOCATION="nbg1"          # Nuremberg
IMAGE_NAME="ubuntu-24.04"
SSH_KEY_NAME="kastriot-macbook"
SSH_PUB_KEY="${SSH_PUB_KEY:-$HOME/.ssh/id_ed25519.pub}"
FIREWALL_NAME="kastriottanaj-web-fw"

log()  { printf "\n\033[1m==> %s\033[0m\n" "$*"; }
fail() { printf "\033[31m!! %s\033[0m\n" "$*" >&2; exit 1; }

[[ -s "$TOKEN_FILE" ]] || fail "No API token at ${TOKEN_FILE}. See the README."
[[ -f "$SSH_PUB_KEY" ]] || fail "No SSH public key at ${SSH_PUB_KEY}."

TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"

# All API traffic goes through here so the token stays in one place.
api() {
  local method="$1" path="$2" body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "${API}${path}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -sS -X "$method" "${API}${path}" -H "Authorization: Bearer ${TOKEN}"
  fi
}

# ── Verify the token before doing anything that costs money ─────────────────
log "Checking API access"
ME="$(api GET "/locations")"
if echo "$ME" | jq -e '.error' >/dev/null 2>&1; then
  fail "Token rejected: $(echo "$ME" | jq -r '.error.message')"
fi
echo "  token OK — $(echo "$ME" | jq -r '.locations | length') locations visible"

api GET "/locations" | jq -e --arg l "$LOCATION" '.locations[] | select(.name == $l)' >/dev/null \
  || fail "Location ${LOCATION} not available"

# ── Resolve the image ───────────────────────────────────────────────────────
# "ubuntu-24.04" is NOT unique: Hetzner publishes an x86 and an arm image under
# the same name. Passing the name with an arm server type silently resolves to
# the x86 one and the create fails with the misleading error "unsupported
# location for server type". Resolve by name AND architecture, and use the id.
log "Resolving ${IMAGE_NAME} (${ARCH})"
IMAGE_ID="$(api GET "/images?type=system&name=${IMAGE_NAME}&architecture=${ARCH}" \
  | jq -r '.images[0].id // empty')"
[[ -n "$IMAGE_ID" ]] || fail "No ${ARCH} image named ${IMAGE_NAME}"
echo "  image id ${IMAGE_ID}"

# ── Confirm the server type is actually in stock ────────────────────────────
# Availability lives on server_types[].locations. Do NOT use /datacenters: it
# was phased out on 2025-12-16 and still reports stale availability — it claimed
# cax11 was in stock at nbg1-dc3 while every ARM type was sold out everywhere,
# and the create then failed with "unsupported location for server type".
log "Checking ${SERVER_TYPE} stock"
TYPE_JSON="$(api GET "/server_types?name=${SERVER_TYPE}")"
jq -e '.server_types[0]' <<<"$TYPE_JSON" >/dev/null || fail "Unknown server type ${SERVER_TYPE}"

AVAILABLE_LOCS="$(jq -r '.server_types[0].locations[] | select(.available) | .name' <<<"$TYPE_JSON")"
if [[ -z "$AVAILABLE_LOCS" ]]; then
  fail "${SERVER_TYPE} is out of stock in every location right now"
fi
echo "  in stock at: $(echo "$AVAILABLE_LOCS" | tr '\n' ' ')"

if ! grep -qx "$LOCATION" <<<"$AVAILABLE_LOCS"; then
  fail "${SERVER_TYPE} not available in ${LOCATION}. In stock at: $(echo "$AVAILABLE_LOCS" | tr '\n' ' ')"
fi

# ── SSH key ─────────────────────────────────────────────────────────────────
log "SSH key"
EXISTING_KEY="$(api GET "/ssh_keys?name=${SSH_KEY_NAME}" | jq -r '.ssh_keys[0].id // empty')"
if [[ -n "$EXISTING_KEY" ]]; then
  SSH_KEY_ID="$EXISTING_KEY"
  echo "  reusing '${SSH_KEY_NAME}' (id ${SSH_KEY_ID})"
else
  SSH_KEY_ID="$(api POST "/ssh_keys" "$(jq -n \
    --arg name "$SSH_KEY_NAME" \
    --arg key "$(cat "$SSH_PUB_KEY")" \
    '{name: $name, public_key: $key}')" | jq -r '.ssh_key.id')"
  [[ -n "$SSH_KEY_ID" && "$SSH_KEY_ID" != "null" ]] || fail "Could not upload SSH key"
  echo "  uploaded '${SSH_KEY_NAME}' (id ${SSH_KEY_ID})"
fi

# ── Firewall ────────────────────────────────────────────────────────────────
# Open 80/443 to the world for now: Caddy needs a reachable HTTP-01 challenge to
# get its first certificate. Once Cloudflare is proxying, run
# deploy/cloudflare-lockdown.sh to restrict them to Cloudflare's ranges.
log "Firewall"
EXISTING_FW="$(api GET "/firewalls?name=${FIREWALL_NAME}" | jq -r '.firewalls[0].id // empty')"
if [[ -n "$EXISTING_FW" ]]; then
  FIREWALL_ID="$EXISTING_FW"
  echo "  reusing '${FIREWALL_NAME}' (id ${FIREWALL_ID})"
else
  FIREWALL_ID="$(api POST "/firewalls" "$(jq -n --arg name "$FIREWALL_NAME" '{
    name: $name,
    rules: [
      { direction: "in", protocol: "tcp", port: "22",  source_ips: ["0.0.0.0/0", "::/0"], description: "SSH" },
      { direction: "in", protocol: "tcp", port: "80",  source_ips: ["0.0.0.0/0", "::/0"], description: "HTTP" },
      { direction: "in", protocol: "tcp", port: "443", source_ips: ["0.0.0.0/0", "::/0"], description: "HTTPS" },
      { direction: "in", protocol: "icmp", source_ips: ["0.0.0.0/0", "::/0"], description: "ping" }
    ]
  }')" | jq -r '.firewall.id')"
  [[ -n "$FIREWALL_ID" && "$FIREWALL_ID" != "null" ]] || fail "Could not create firewall"
  echo "  created '${FIREWALL_NAME}' (id ${FIREWALL_ID})"
fi

# ── Server ──────────────────────────────────────────────────────────────────
log "Server"
EXISTING_SERVER="$(api GET "/servers?name=${SERVER_NAME}" | jq -r '.servers[0] | select(.) | @json')"
if [[ -n "$EXISTING_SERVER" ]]; then
  SERVER_IP="$(echo "$EXISTING_SERVER" | jq -r '.public_net.ipv4.ip')"
  SERVER_ID="$(echo "$EXISTING_SERVER" | jq -r '.id')"
  echo "  '${SERVER_NAME}' already exists (id ${SERVER_ID}) at ${SERVER_IP}"
else
  echo "  creating ${SERVER_TYPE} in ${LOCATION} — this starts billing"
  CREATE="$(api POST "/servers" "$(jq -n \
    --arg name "$SERVER_NAME" \
    --arg type "$SERVER_TYPE" \
    --argjson image "$IMAGE_ID" \
    --arg location "$LOCATION" \
    --argjson ssh_key "$SSH_KEY_ID" \
    --argjson fw "$FIREWALL_ID" \
    '{
      name: $name,
      server_type: $type,
      image: $image,
      location: $location,
      ssh_keys: [$ssh_key],
      firewalls: [{firewall: $fw}],
      public_net: {enable_ipv4: true, enable_ipv6: true},
      labels: {project: "kastriottanaj"}
    }')")"

  if echo "$CREATE" | jq -e '.error' >/dev/null 2>&1; then
    fail "Create failed: $(echo "$CREATE" | jq -r '.error.message')"
  fi

  SERVER_ID="$(echo "$CREATE" | jq -r '.server.id')"
  SERVER_IP="$(echo "$CREATE" | jq -r '.server.public_net.ipv4.ip')"
  echo "  created id ${SERVER_ID} at ${SERVER_IP}"

  printf "  waiting for boot"
  for _ in $(seq 1 60); do
    STATUS="$(api GET "/servers/${SERVER_ID}" | jq -r '.server.status')"
    [[ "$STATUS" == "running" ]] && break
    printf "."
    sleep 5
  done
  printf "\n  status: %s\n" "$STATUS"
fi

SERVER_IPV6="$(api GET "/servers/${SERVER_ID}" | jq -r '.server.public_net.ipv6.ip // empty')"

# ── Wait for SSH ────────────────────────────────────────────────────────────
log "Waiting for SSH"
for _ in $(seq 1 40); do
  if ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 -o BatchMode=yes \
       "root@${SERVER_IP}" true 2>/dev/null; then
    echo "  SSH ready"
    break
  fi
  printf "."
  sleep 5
done

cat <<EOF

────────────────────────────────────────────────────────────────────────
Server ready.

  Name  ${SERVER_NAME}  (${SERVER_TYPE}, ${LOCATION})
  IPv4  ${SERVER_IP}
  IPv6  ${SERVER_IPV6}
  SSH   ssh root@${SERVER_IP}

Next, in order:

  1. Cloudflare DNS — add these as "DNS only" (grey cloud) FIRST, so Caddy can
     complete the HTTP-01 challenge and get a real certificate:

       A     kastriottanaj.com       ${SERVER_IP}
       A     www.kastriottanaj.com   ${SERVER_IP}

  2. Provision and deploy:
       ssh root@${SERVER_IP} 'bash -s' < deploy/setup-server.sh

  3. Fill in secrets:
       ssh root@${SERVER_IP} 'nano /etc/kastriottanaj/env'

  4. Once https://kastriottanaj.com serves with a valid cert, flip both records
     to "Proxied" (orange cloud) and set SSL/TLS mode to "Full (strict)".

  5. Optional hardening, after the proxy is on:
       bash deploy/cloudflare-lockdown.sh ${SERVER_IP}
────────────────────────────────────────────────────────────────────────
EOF
