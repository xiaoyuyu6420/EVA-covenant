#!/bin/sh
set -e

DB_PATH="/app/data/eva-covenant.db"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/eva-covenant_${TIMESTAMP}.db"

if [ ! -f "$DB_PATH" ]; then
  echo "[$(date)] No database found, skipping backup."
  exit 0
fi

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '${BACKUP_FILE}'"
gzip -f "$BACKUP_FILE"
echo "[$(date)] Backup created: ${BACKUP_FILE}.gz"

cd "$BACKUP_DIR"
ls -t eva-covenant_*.db.gz 2>/dev/null | tail -n +31 | xargs -r rm -f
echo "[$(date)] Backups: $(ls eva-covenant_*.db.gz 2>/dev/null | wc -l | tr -d ' ')"
