#!/usr/bin/env bash
# Publica a versão <tag>. Executado em /opt/agcriando pelo pipeline (via SSM).
set -euo pipefail
cd "$(dirname "$0")/.."

TAG=${1:?tag da imagem}
COMPOSE_FILES=${COMPOSE_FILES:--f docker-compose.prod.yml -f docker-compose.aws.yml}
# shellcheck disable=SC2086
compose() { docker compose --env-file .env $COMPOSE_FILES "$@"; }

[ "${SKIP_RENDER_ENV:-}" = 1 ] || ./scripts/render-env.sh /agcriando/prod .env

set -a
# .env é gerado em tempo de execução pelo render-env.sh.
# shellcheck source=/dev/null
. ./.env
set +a
REGISTRY=${REGISTRY:-$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com}

if [ "${SKIP_ECR_LOGIN:-}" != 1 ]; then
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"
fi

# O ambiente do shell tem prioridade sobre o .env no compose: exporta a versão nova
# e grava no .env para que comandos manuais do compose usem a mesma versão.
export API_IMAGE="$REGISTRY/agcriando-api:$TAG"
export WEB_IMAGE="$REGISTRY/agcriando-web:$TAG"
export MIGRATOR_IMAGE="$REGISTRY/agcriando-migrator:$TAG"
sed -i '/^\(API\|WEB\|MIGRATOR\)_IMAGE=/d' .env
{
  printf "API_IMAGE='%s'\n" "$API_IMAGE"
  printf "WEB_IMAGE='%s'\n" "$WEB_IMAGE"
  printf "MIGRATOR_IMAGE='%s'\n" "$MIGRATOR_IMAGE"
} >> .env

echo "==> imagens $TAG"
[ "${SKIP_PULL:-}" = 1 ] || compose pull api web migrator

echo "==> migrations"
compose up -d db
compose run --rm migrator

echo "==> subindo serviços"
compose up -d --remove-orphans
# O Nginx resolve os upstreams só ao iniciar; após recriar api/web ele manteria os IPs antigos (502).
compose exec -T nginx nginx -s reload

echo "==> health check"
curl_opts=(-fsS --max-time 5)
[ "${HEALTH_INSECURE:-}" = 1 ] && curl_opts+=(-k)
for _ in $(seq 1 36); do
  if curl "${curl_opts[@]}" "https://$DOMAIN/api/health" >/dev/null 2>&1; then
    docker image prune -f >/dev/null
    echo "deploy ok: $TAG"
    exit 0
  fi
  sleep 5
done

echo "health check falhou após o deploy de $TAG" >&2
compose ps >&2
exit 1
