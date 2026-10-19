#!/usr/bin/env bash
# Publica a versão <tag>. Executado em /opt/agcriando pelo pipeline (via SSH), depois do write-env.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

TAG=${1:?tag da imagem}
COMPOSE_FILES=${COMPOSE_FILES:--f docker-compose.prod.yml}
REGISTRY=${REGISTRY:-ghcr.io/henrique-santos}
# shellcheck disable=SC2086
compose() { docker compose --env-file .env $COMPOSE_FILES "$@"; }

[ -s .env ] || { echo ".env ausente: o pipeline grava com write-env.sh antes do deploy" >&2; exit 1; }

# O ambiente do shell tem prioridade sobre o .env no compose: a versão nova vale para este deploy,
# mas só é gravada no .env depois do health check (uma falha não deixa o .env apontando para ela).
export API_IMAGE="$REGISTRY/agcriando-api:$TAG"
export WEB_IMAGE="$REGISTRY/agcriando-web:$TAG"
export MIGRATOR_IMAGE="$REGISTRY/agcriando-migrator:$TAG"

echo "==> imagens $TAG"
[ "${SKIP_PULL:-}" = 1 ] || compose pull api web migrator

echo "==> migrations"
compose up -d db
compose run --rm migrator

echo "==> subindo serviços"
compose up -d --remove-orphans
# O Nginx resolve os upstreams só ao iniciar; após recriar api/web ele manteria os IPs antigos (502).
compose exec -T nginx nginx -s reload 2>/dev/null || compose restart nginx

echo "==> health check"
# Direto na porta local do Nginx (a mesma que o cloudflared usa).
for _ in $(seq 1 36); do
  if curl -fsS --max-time 5 http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
    sed -i '/^\(API\|WEB\|MIGRATOR\)_IMAGE=/d' .env
    {
      printf "API_IMAGE='%s'\n" "$API_IMAGE"
      printf "WEB_IMAGE='%s'\n" "$WEB_IMAGE"
      printf "MIGRATOR_IMAGE='%s'\n" "$MIGRATOR_IMAGE"
    } >> .env
    # Remove só versões antigas das imagens da loja (o GHCR guarda as 10 últimas para rollback).
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
