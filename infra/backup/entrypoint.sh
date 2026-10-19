#!/bin/sh
# Agenda o backup diário às 03:00 no fuso de TZ e mantém o crond em primeiro plano.
# BACKUP_NOW=1: executa um backup e sai (testes e backup manual).
set -eu

apk add --no-cache aws-cli tzdata >/dev/null

# O crond do busybox não repassa o ambiente aos jobs; gravamos só o necessário.
# R2: endpoint próprio, região "auto" e checksums só quando exigidos.
{
  printf "export DB_PASSWORD='%s'\n" "$DB_PASSWORD"
  printf "export DB_HOST='%s'\n" "${DB_HOST:-db}"
  printf "export BACKUP_BUCKET='%s'\n" "${BACKUP_BUCKET:-}"
  printf "export AWS_ENDPOINT_URL='%s'\n" "${R2_ENDPOINT:-}"
  printf "export AWS_ACCESS_KEY_ID='%s'\n" "${AWS_ACCESS_KEY_ID:-}"
  printf "export AWS_SECRET_ACCESS_KEY='%s'\n" "${AWS_SECRET_ACCESS_KEY:-}"
  printf "export AWS_DEFAULT_REGION='auto'\n"
  printf "export AWS_REQUEST_CHECKSUM_CALCULATION='when_required'\n"
  printf "export AWS_RESPONSE_CHECKSUM_VALIDATION='when_required'\n"
  printf "export TZ='%s'\n" "${TZ:-America/Manaus}"
} > /etc/backup.env
chmod 600 /etc/backup.env

if [ "${BACKUP_NOW:-}" = 1 ]; then
  . /etc/backup.env && exec sh /scripts/backup.sh
fi

echo "0 3 * * * . /etc/backup.env && sh /scripts/backup.sh >> /proc/1/fd/1 2>&1" | crontab -
exec crond -f -l 8
