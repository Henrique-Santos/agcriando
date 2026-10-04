#!/usr/bin/env bash
# Testa deploy.sh contra a pilha local: primeiro deploy sem certificado, falha de migration
# sem derrubar a versão no ar (nem apontar o .env para ela) e recriação de container sem reload.
set -euo pipefail
INFRA=$(cd "$(dirname "$0")/.." && pwd)
cd "$INFRA"

# Domínio próprio do teste: não existe certificado para ele, como numa instância nova.
DOMAIN=deploy-test-$$.localhost
cleanup() { docker run --rm -v "$INFRA/certbot/conf:/etc/letsencrypt" alpine:3 rm -rf "/etc/letsencrypt/live/$DOMAIN"; }
trap cleanup EXIT
sed "s/^DOMAIN=.*/DOMAIN=$DOMAIN/" local.env > .env
printf "AWS_ACCOUNT_ID='000000000000'\n" >> .env
export SKIP_RENDER_ENV=1 SKIP_ECR_LOGIN=1 SKIP_PULL=1 REGISTRY=agcriando
export COMPOSE_FILES="-f docker-compose.prod.yml -f docker-compose.local.yml"
compose() { # shellcheck disable=SC2086
  docker compose --env-file .env $COMPOSE_FILES "$@"; }
health() { curl -fsSk --max-time 5 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/api/health" >/dev/null; }

docker tag agcriando-api:local agcriando/agcriando-api:t1
docker tag agcriando-web:local agcriando/agcriando-web:t1
docker tag agcriando-migrator:local agcriando/agcriando-migrator:t1

[ ! -e "certbot/conf/live/$DOMAIN" ] || { echo "FAIL pré-condição: já existe certificado para $DOMAIN"; exit 1; }
./scripts/deploy.sh t1 | tail -1 | grep -q "deploy ok: t1" || { echo "FAIL primeiro deploy sem certificado"; exit 1; }
[ -s "certbot/conf/live/$DOMAIN/fullchain.pem" ] || { echo "FAIL certificado provisório não criado"; exit 1; }
grep -q "^API_IMAGE='agcriando/agcriando-api:t1'$" .env || { echo "FAIL .env sem imagem t1"; exit 1; }

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

rm -f .env
echo "deploy: ok"
