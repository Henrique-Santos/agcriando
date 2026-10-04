#!/bin/sh
# Agenda o backup diário às 03:00 no fuso de TZ e mantém o crond em primeiro plano.
set -eu

apk add --no-cache aws-cli tzdata >/dev/null

# O crond do busybox não repassa o ambiente aos jobs; gravamos só o necessário.
{
  printf "export DB_PASSWORD='%s'\n" "$DB_PASSWORD"
  printf "export BACKUP_BUCKET='%s'\n" "${BACKUP_BUCKET:-}"
  printf "export AWS_REGION='%s'\n" "${AWS_REGION:-}"
  printf "export TZ='%s'\n" "${TZ:-America/Manaus}"
} > /etc/backup.env
chmod 600 /etc/backup.env

echo "0 3 * * * . /etc/backup.env && sh /scripts/backup.sh >> /proc/1/fd/1 2>&1" | crontab -
exec crond -f -l 8
