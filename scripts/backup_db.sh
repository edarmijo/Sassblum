#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SassBlum — Automated Database Backup Script
# H#24 (audit): Automatización de backups de BD
# ═══════════════════════════════════════════════════════════════
#
# Uso:
#   ./scripts/backup_db.sh                    # Backup manual
#   crontab -e → 0 2 * * * /path/to/backup  # Backup diario a las 2am
#
# Requisitos:
#   - pg_dump instalado (postgresql-client)
#   - Variable DATABASE_URL configurada o pasada como argumento
#   - Directorio /backups/ con permisos de escritura
#
# Restaurar:
#   pg_restore -d sassblum_db backup_2026-06-25.dump
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups/sassblum}"
DB_URL="${DATABASE_URL:-}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y-%m-%d_%H%M)
FILENAME="sassblum_backup_${DATE}.dump"

# Validate
if [ -z "$DB_URL" ]; then
    echo "ERROR: DATABASE_URL not set. Pass it as env var or argument."
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Run pg_dump (custom format for compression + selective restore)
pg_dump "$DB_URL" \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="${BACKUP_DIR}/${FILENAME}" 2>&1

# Verify backup file exists and has size > 0
if [ ! -s "${BACKUP_DIR}/${FILENAME}" ]; then
    echo "ERROR: Backup file is empty or missing!"
    exit 1
fi

FILESIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date)] Backup complete: ${FILENAME} (${FILESIZE})"

# Cleanup old backups (keep last N days)
echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "sassblum_backup_*.dump" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true

# List current backups
echo "[$(date)] Current backups:"
ls -lh "$BACKUP_DIR"/sassblum_backup_*.dump 2>/dev/null || echo "  (none)"

echo "[$(date)] Backup process finished."
