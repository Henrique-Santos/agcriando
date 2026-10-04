#!/usr/bin/env bash
# Gera o .env do compose a partir do SSM Parameter Store. Uso: render-env.sh [prefixo] [arquivo]
set -euo pipefail

PREFIX=${1:-/agcriando/prod}
OUT=${2:-.env}
TMP="$OUT.tmp.$$"
trap 'rm -f "$TMP"' EXIT

umask 077
aws ssm get-parameters-by-path --path "$PREFIX" --recursive --with-decryption \
    --query 'Parameters[].[Name,Value]' --output text |
  while IFS=$'\t' read -r name value; do
    [ -n "$name" ] && printf "%s='%s'\n" "${name##*/}" "$value"
  done > "$TMP"

if [ ! -s "$TMP" ]; then
  echo "Nenhum parâmetro encontrado em $PREFIX" >&2
  exit 1
fi

chmod 600 "$TMP"
mv "$TMP" "$OUT"
