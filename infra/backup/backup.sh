#!/bin/sh
# Dump do Postgres em formato custom (comprimido). Destino: S3 se BACKUP_BUCKET existir, senão /backups.
set -eu

: "${DB_PASSWORD:?DB_PASSWORD obrigatório}"
STAMP=$(date -u +%Y-%m-%dT%H%M%SZ)
FILE="/tmp/agcriando-$STAMP.dump"

PGPASSWORD="$DB_PASSWORD" pg_dump -h "${DB_HOST:-db}" -U agcriando -d agcriando -Fc --no-owner -f "$FILE"

if [ -n "${BACKUP_BUCKET:-}" ]; then
  aws s3 cp "$FILE" "s3://$BACKUP_BUCKET/backups/$(basename "$FILE")" --only-show-errors
  rm -f "$FILE"
else
  mkdir -p /backups
  mv "$FILE" /backups/
fi

echo "backup ok: $STAMP"
