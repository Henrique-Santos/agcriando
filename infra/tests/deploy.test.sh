#!/usr/bin/env bash
# Testa deploy.sh contra a pilha local: falha de migration sem derrubar a versão no ar (nem apontar
# o .env para ela), recriação de container sem reload e cabeçalhos repassados pelo túnel da Cloudflare.
set -euo pipefail
INFRA=$(cd "$(dirname "$0")/.." && pwd)
cd "$INFRA"

trap 'rm -f .env' EXIT
cp local.env .env
export SKIP_PULL=1 REGISTRY=agcriando
export COMPOSE_FILES="-f docker-compose.prod.yml -f docker-compose.local.yml"
compose() { # shellcheck disable=SC2086
  docker compose --env-file .env $COMPOSE_FILES "$@"; }
BASE=http://127.0.0.1:8080
health() { curl -fsS --max-time 5 "$BASE/api/health" >/dev/null; }

docker tag agcriando-api:local agcriando/agcriando-api:t1
docker tag agcriando-web:local agcriando/agcriando-web:t1
docker tag agcriando-migrator:local agcriando/agcriando-migrator:t1

./scripts/deploy.sh t1 | tail -1 | grep -q "deploy ok: t1" || { echo "FAIL primeiro deploy"; exit 1; }
grep -q "^API_IMAGE='agcriando/agcriando-api:t1'$" .env || { echo "FAIL .env sem imagem t1"; exit 1; }

# Atrás do túnel: X-Forwarded-Proto vindo do cloudflared chega à API (cookie Secure no login).
cookie=$(curl -sS -o /dev/null -D - -X POST "$BASE/api/auth/login" \
  -H 'X-Requested-With: fetch' -H 'X-Forwarded-Proto: https' -H 'Content-Type: application/json' \
  -d '{"email":"admin@agcriando.local","password":"agcriando-local-123"}' | grep -i '^set-cookie: agc_session=')
echo "$cookie" | grep -qi 'secure' || { echo "FAIL cookie sem Secure atrás do túnel"; exit 1; }

# Rate limit de login por CF-Connecting-IP: esgotar o IP A não pode bloquear o IP B.
login() { curl -sS -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/login" -H "CF-Connecting-IP: $1" \
  -H 'X-Requested-With: fetch' -H 'Content-Type: application/json' -d '{"email":"x@x.x","password":"errada"}'; }
for _ in $(seq 1 10); do login 203.0.113.10 >/dev/null; done
[ "$(login 203.0.113.10)" = 429 ] || { echo "FAIL IP A deveria estar limitado"; exit 1; }
[ "$(login 203.0.113.20)" != 429 ] || { echo "FAIL IP B limitado junto com o A (IP do cliente perdido no proxy)"; exit 1; }

# Migrator quebrado: o deploy falha, a versão anterior continua no ar e o .env segue em t1.
docker build -q -t agcriando/agcriando-migrator:t2 - <<'EOF' >/dev/null
FROM alpine:3
ENTRYPOINT ["sh", "-c", "echo migration falhou >&2; exit 3"]
EOF
docker tag agcriando-api:local agcriando/agcriando-api:t2
docker tag agcriando-web:local agcriando/agcriando-web:t2
if ./scripts/deploy.sh t2 >/tmp/deploy-t2.log 2>&1; then echo "FAIL deploy t2 deveria falhar"; exit 1; fi
grep -q "migration falhou" /tmp/deploy-t2.log || { echo "FAIL causa não aparece no log"; exit 1; }
health || { echo "FAIL versão anterior caiu"; exit 1; }
grep -q "^API_IMAGE='agcriando/agcriando-api:t1'$" .env || { echo "FAIL .env aponta para a versão que falhou"; exit 1; }

# API recriada (novo IP) sem reload manual do Nginx: o proxy precisa voltar sozinho.
compose up -d --force-recreate --no-deps api >/dev/null 2>&1
ok=0
for _ in $(seq 1 30); do if health; then ok=1; break; fi; sleep 2; done
[ "$ok" = 1 ] || { echo "FAIL Nginx não alcança a API recriada (upstream com IP antigo)"; exit 1; }

compose down >/dev/null 2>&1
echo "deploy: ok"
