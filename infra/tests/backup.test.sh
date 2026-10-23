#!/usr/bin/env bash
# Testa o backup contra um S3 compatível local (S3Mock): mesmo caminho de endpoint/credenciais do R2.
set -euo pipefail
INFRA=$(cd "$(dirname "$0")/.." && pwd)
NET=backup-test-$$
cleanup() { docker rm -f "$NET-db" "$NET-s3" >/dev/null 2>&1 || true; docker network rm "$NET" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker network create "$NET" >/dev/null
docker run -d --name "$NET-db" --network "$NET" -e POSTGRES_DB=agcriando -e POSTGRES_USER=agcriando \
  -e POSTGRES_PASSWORD=pw postgres:17-alpine >/dev/null
docker run -d --name "$NET-s3" --network "$NET" adobe/s3mock:5.0.0 >/dev/null
# aws-cli num container à parte, apontado para o S3Mock (aceita qualquer credencial).
s3() { docker run --rm --network "$NET" -e AWS_ACCESS_KEY_ID=testkey -e AWS_SECRET_ACCESS_KEY=testsecret \
  -e AWS_DEFAULT_REGION=auto postgres:17-alpine sh -c "apk add -q --no-cache aws-cli >/dev/null && aws --endpoint-url http://$NET-s3:9090 $*"; }
for _ in $(seq 1 60); do s3 s3 mb s3://backups-test >/dev/null 2>&1 && break; sleep 2; done
for _ in $(seq 1 30); do docker exec "$NET-db" pg_isready -U agcriando -d agcriando >/dev/null 2>&1 && break; sleep 1; done

# Roda o mesmo entrypoint do compose, mas executa um backup na hora em vez de agendar.
docker run --rm --network "$NET" -v "$INFRA/backup:/scripts:ro" \
  -e DB_PASSWORD=pw -e DB_HOST="$NET-db" -e BACKUP_BUCKET=backups-test \
  -e R2_ENDPOINT="http://$NET-s3:9090" -e AWS_ACCESS_KEY_ID=testkey -e AWS_SECRET_ACCESS_KEY=testsecret \
  -e BACKUP_NOW=1 postgres:17-alpine sh /scripts/entrypoint.sh | tail -1 | grep -q "backup ok" \
  || { echo "FAIL backup não terminou"; exit 1; }

s3 s3 ls s3://backups-test/backups/ | grep -q "agcriando-.*\.dump$" \
  || { echo "FAIL dump não chegou ao bucket"; exit 1; }

echo "backup: ok"
