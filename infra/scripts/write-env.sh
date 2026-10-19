#!/usr/bin/env bash
# Grava o .env do compose a partir das linhas NOME='valor' recebidas no stdin (enviadas pelo pipeline).
# A última linha deve ser #END: entrada truncada (pipeline abortado, SSH caído) não substitui o .env.
# Mantém as imagens em uso (*_IMAGE): quem as atualiza é o deploy.sh, só após o health check.
set -euo pipefail

OUT=${1:?arquivo de saída}
TMP="$OUT.tmp.$$"
trap 'rm -f "$TMP"' EXIT
umask 077

input=$(cat)
[ "${input##*$'\n'}" = "#END" ] || { echo "Entrada incompleta (falta a linha #END no fim)" >&2; exit 1; }
input=${input%#END}
input=${input%$'\n'}
[ -n "$input" ] || { echo "Nenhuma variável recebida no stdin" >&2; exit 1; }
if bad=$(printf '%s\n' "$input" | grep -vxE "[A-Z_][A-Z0-9_]*='[^']*'"); then
  echo "Linha inválida (use NOME='valor', sem aspas simples no valor): ${bad%%=*}" >&2
  exit 1
fi

{
  printf '%s\n' "$input"
  [ -f "$OUT" ] && grep -E '^(API|WEB|MIGRATOR)_IMAGE=' "$OUT" || true
} > "$TMP"

chmod 600 "$TMP"
mv "$TMP" "$OUT"
