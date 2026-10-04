#!/usr/bin/env bash
# Verificações de fumaça da pilha publicada. Uso: smoke.sh https://dominio [--insecure]
set -euo pipefail

BASE=${1:?url base}
CURL=(curl -sS -o /dev/null -w '%{http_code}' --max-time 20)
[ "${2:-}" = "--insecure" ] && CURL+=(-k)
fail=0

check() { # check <descrição> <status esperado> <curl args...>
  local name=$1 expected=$2; shift 2
  local got
  got=$("${CURL[@]}" "$@" || true)
  if [ "$got" = "$expected" ]; then echo "ok   $name ($got)"; else echo "FAIL $name: esperado $expected, veio $got"; fail=1; fi
}

host=${BASE#https://}
check "HTTP redireciona para HTTPS"   301 "http://$host/"
check "página inicial"                200 "$BASE/"
check "página de produto"             200 "$BASE/produto/caderno-floral"
check "API health"                    200 "$BASE/api/health"
check "catálogo da API"               200 "$BASE/api/catalog"
check "revalidate bloqueado de fora"  404 -X POST "$BASE/api/revalidate"
check "admin exige login"             307 "$BASE/admin/produtos"
check "sitemap"                       200 "$BASE/sitemap.xml"

tmp=$(mktemp); head -c 12000000 /dev/urandom > "$tmp"
check "upload > 11 MB barrado no Nginx" 413 -X POST -H 'X-Requested-With: fetch' -F "file=@$tmp;type=image/jpeg" "$BASE/api/admin/uploads"
head -c 9500000 /dev/urandom > "$tmp"
check "upload ~9,5 MB chega à API (401 sem login)" 401 -X POST -H 'X-Requested-With: fetch' -F "file=@$tmp;type=image/jpeg" "$BASE/api/admin/uploads"
rm -f "$tmp"

exit $fail
