#!/usr/bin/env bash
# Testa deploy.sh contra a pilha local: sucesso, e falha de migration sem derrubar a versão no ar.
set -euo pipefail
INFRA=$(cd "$(dirname "$0")/.." && pwd)
cd "$INFRA"

cp local.env .env
printf "AWS_ACCOUNT_ID='000000000000'\n" >> .env
export SKIP_RENDER_ENV=1 SKIP_ECR_LOGIN=1 SKIP_PULL=1 HEALTH_INSECURE=1 REGISTRY=agcriando
export COMPOSE_FILES="-f docker-compose.prod.yml -f docker-compose.local.yml"

docker tag agcriando-api:local agcriando/agcriando-api:t1
docker tag agcriando-web:local agcriando/agcriando-web:t1
docker tag agcriando-migrator:local agcriando/agcriando-migrator:t1

./scripts/deploy.sh t1 | tail -1 | grep -q "deploy ok: t1" || { echo "FAIL deploy t1"; exit 1; }
grep -q "^API_IMAGE='agcriando/agcriando-api:t1'$" .env || { echo "FAIL .env sem imagem"; exit 1; }

# Migrator quebrado: o deploy falha e a API anterior continua respondendo.
docker build -q -t agcriando/agcriando-migrator:t2 - <<'EOF' >/dev/null
FROM alpine:3
ENTRYPOINT ["sh", "-c", "echo migration falhou >&2; exit 3"]
EOF
docker tag agcriando-api:local agcriando/agcriando-api:t2
docker tag agcriando-web:local agcriando/agcriando-web:t2
if ./scripts/deploy.sh t2 >/tmp/deploy-t2.log 2>&1; then echo "FAIL deploy t2 deveria falhar"; exit 1; fi
grep -q "migration falhou" /tmp/deploy-t2.log || { echo "FAIL causa não aparece no log"; exit 1; }
curl -fsSk https://localhost/api/health >/dev/null || { echo "FAIL versão anterior caiu"; exit 1; }

rm -f .env
echo "deploy: ok"
