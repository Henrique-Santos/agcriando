#!/usr/bin/env bash
# Testa write-env.sh: grava os segredos, preserva a versão no ar e rejeita linhas inválidas.
set -euo pipefail
SCRIPT=$(cd "$(dirname "$0")/.." && pwd)/scripts/write-env.sh
DIR=$(mktemp -d); trap 'rm -rf "$DIR"' EXIT
ENV=$DIR/.env

printf "DB_PASSWORD='velha'\nAPI_IMAGE='r/agcriando-api:t1'\nWEB_IMAGE='r/agcriando-web:t1'\nMIGRATOR_IMAGE='r/agcriando-migrator:t1'\n" > "$ENV"

printf "DB_PASSWORD='nova'\nDOMAIN='agcriando.com.br'\n#END\n" | "$SCRIPT" "$ENV"
grep -qx "DB_PASSWORD='nova'" "$ENV" || { echo "FAIL segredo não atualizado"; exit 1; }
grep -q "velha" "$ENV" && { echo "FAIL valor antigo permaneceu"; exit 1; }
grep -qx "API_IMAGE='r/agcriando-api:t1'" "$ENV" || { echo "FAIL perdeu a imagem no ar"; exit 1; }
grep -qx "MIGRATOR_IMAGE='r/agcriando-migrator:t1'" "$ENV" || { echo "FAIL perdeu o migrator no ar"; exit 1; }
[ "$(stat -c %a "$ENV")" = 600 ] || { echo "FAIL permissão diferente de 600"; exit 1; }

before=$(cat "$ENV")
if printf "DB_PASSWORD='com'aspas'\n#END\n" | "$SCRIPT" "$ENV" 2>/dev/null; then echo "FAIL aceitou aspas no valor"; exit 1; fi
if printf "nome-invalido='x'\n#END\n" | "$SCRIPT" "$ENV" 2>/dev/null; then echo "FAIL aceitou nome inválido"; exit 1; fi
if printf "#END\n" | "$SCRIPT" "$ENV" 2>/dev/null; then echo "FAIL aceitou entrada vazia"; exit 1; fi
# Entrada truncada (pipeline abortado ou SSH caído no meio): sem o marcador final, nada é gravado.
if printf "DOMAIN='x'\n" | "$SCRIPT" "$ENV" 2>/dev/null; then echo "FAIL aceitou entrada sem #END"; exit 1; fi
[ "$(cat "$ENV")" = "$before" ] || { echo "FAIL .env alterado após rejeição"; exit 1; }

# Primeira vez (sem .env anterior).
printf "DOMAIN='x'\n#END\n" | "$SCRIPT" "$DIR/novo.env"
grep -qx "DOMAIN='x'" "$DIR/novo.env" || { echo "FAIL primeira gravação"; exit 1; }

echo "write-env: ok"
