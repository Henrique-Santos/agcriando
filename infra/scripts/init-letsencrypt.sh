#!/usr/bin/env bash
# Emite o certificado inicial. Uso: init-letsencrypt.sh <domínio> <email> [--self-signed]
#   --self-signed: só cria o certificado provisório (teste local ou antes do DNS apontar).
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN=${1:?domínio}
EMAIL=${2:?email}
MODE=${3:-}
COMPOSE=${COMPOSE:-docker compose -f docker-compose.prod.yml -f docker-compose.aws.yml}
LIVE="certbot/conf/live/$DOMAIN"

mkdir -p "$LIVE" certbot/www

if [ ! -s "$LIVE/fullchain.pem" ]; then
  echo "Criando certificado provisório para $DOMAIN..."
  docker run --rm -v "$PWD/certbot/conf:/etc/letsencrypt" alpine:3 sh -c \
    "apk add -q --no-cache openssl && openssl req -x509 -nodes -newkey rsa:2048 -days 2 \
      -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
      -subj /CN=$DOMAIN >/dev/null 2>&1"
fi

[ "$MODE" = "--self-signed" ] && { echo "Certificado provisório pronto."; exit 0; }

$COMPOSE up -d nginx
# Remove o provisório (o Nginx já o carregou) para o certbot criar a estrutura definitiva.
rm -rf "certbot/conf/live/$DOMAIN" "certbot/conf/archive/$DOMAIN" "certbot/conf/renewal/$DOMAIN.conf"
$COMPOSE run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --non-interactive
$COMPOSE exec nginx nginx -s reload
echo "Certificado Let's Encrypt emitido para $DOMAIN."
