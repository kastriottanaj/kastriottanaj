#!/usr/bin/env bash
#
# Nightly SQLite backup. Installed to /usr/local/bin/ and run from cron by
# setup-server.sh.
#
# The file holds the newsletter subscriber list as well as the leads, so this is
# also what stands between a disk failure and asking everyone to subscribe again.
#
# Uses the sqlite backup API via node:sqlite rather than copying the file —
# a plain cp of a WAL-mode database mid-write produces a corrupt copy.

set -euo pipefail

DB="${LEADS_DB_PATH:-/var/www/kastriottanaj/data/leads.db}"
DEST="${BACKUP_DIR:-/var/www/kastriottanaj/backups}"
KEEP_DAYS=30

[[ -f "$DB" ]] || { echo "$(date +%Y-%m-%dT%H:%M:%S) no database at $DB yet — nothing to back up"; exit 0; }

mkdir -p "$DEST"
STAMP="$(date +%Y%m%d)"
OUT="${DEST}/leads-${STAMP}.db"

node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(process.argv[1], { readOnly: true });
db.exec(\`VACUUM INTO '\${process.argv[2].replace(/'/g, \"''\")}'\`);
db.close();
" "$DB" "$OUT"

gzip -f "$OUT"
echo "$(date +%Y-%m-%dT%H:%M:%S) backed up -> ${OUT}.gz ($(du -h "${OUT}.gz" | cut -f1))"

# Prune old copies.
find "$DEST" -name 'leads-*.db.gz' -mtime "+${KEEP_DAYS}" -delete

# Off-box copy. Uncomment once you have somewhere to send it — a backup that
# only exists on the machine it protects is not a backup.
# rclone copy "${OUT}.gz" remote:kastriottanaj-backups/
