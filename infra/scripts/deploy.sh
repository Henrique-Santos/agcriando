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

# O ambiente do shell tem prioridade sobre o .env no compose: a versão nova vale para este deploy,
# mas só é gravada no .env depois do health check (uma falha não deixa o .env apontando para ela).
export API_IMAGE="$REGISTRY/agcriando-api:$TAG"
export WEB_IMAGE="$REGISTRY/agcriando-web:$TAG"
export MIGRATOR_IMAGE="$REGISTRY/agcriando-migrator:$TAG"

# Instância nova: o Nginx não sobe sem certificado. Cria um provisório; o definitivo vem do init-letsencrypt.sh.
[ -s "certbot/conf/live/$DOMAIN/fullchain.pem" ] || ./scripts/init-letsencrypt.sh "$DOMAIN" unused --self-signed

echo "==> imagens $TAG"
[ "${SKIP_PULL:-}" = 1 ] || compose pull api web migrator

echo "==> migrations"
compose up -d db
compose run --rm migrator

echo "==> subindo serviços"
compose up -d --remove-orphans
# O Nginx resolve os upstreams só ao iniciar; após recriar api/web ele manteria os IPs antigos (502).
# Se o Nginx estiver em loop de reinício (ex.: subiu antes do certificado existir), reinicia em vez de recarregar.
compose exec -T nginx nginx -s reload 2>/dev/null || compose restart nginx

echo "==> health check"
# Direto na própria máquina: não depende de DNS nem de o certificado já ser o definitivo.
for _ in $(seq 1 36); do
  if curl -fsSk --max-time 5 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/api/health" >/dev/null 2>&1; then
    sed -i '/^\(API\|WEB\|MIGRATOR\)_IMAGE=/d' .env
    {
      printf "API_IMAGE='%s'\n" "$API_IMAGE"
      printf "WEB_IMAGE='%s'\n" "$WEB_IMAGE"
      printf "MIGRATOR_IMAGE='%s'\n" "$MIGRATOR_IMAGE"
    } >> .env
    # Remove só versões antigas das imagens da loja (as em uso ficam; o ECR guarda as 10 últimas para rollback).
    # Nada de `docker image prune -a`: apagaria qualquer imagem sem uso da máquina.
    docker images --format '{{.Repository}}:{{.Tag}}' | grep -E "/agcriando-(api|web|migrator):" | grep -v ":$TAG\$" \
      | xargs -r docker rmi >/dev/null 2>&1 || true
    echo "deploy ok: $TAG"
    exit 0
  fi
  sleep 5
done

echo "health check falhou após o deploy de $TAG" >&2
compose ps >&2
exit 1
