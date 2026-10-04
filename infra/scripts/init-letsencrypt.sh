#!/usr/bin/env bash
# Emite o certificado inicial. Uso: init-letsencrypt.sh <domínio> <email> [--self-signed]
#   --self-signed: só cria o certificado provisório (teste local, ou antes do DNS apontar).
# Seguro para reexecutar: não toca num certificado definitivo e, se o certbot falhar,
# devolve o provisório para o Nginx continuar no ar.
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN=${1:?domínio}
EMAIL=${2:?email}
MODE=${3:-}
COMPOSE=${COMPOSE:-docker compose --env-file .env -f docker-compose.prod.yml -f docker-compose.aws.yml}
CONF=certbot/conf
mkdir -p "$CONF" certbot/www

# Os arquivos de certificado pertencem ao root (criados por containers); operamos sobre eles num container.
in_conf() { docker run --rm -v "$PWD/$CONF:/etc/letsencrypt" alpine:3 sh -c "apk add -q --no-cache openssl >/dev/null && $1"; }

if [ ! -s "$CONF/live/$DOMAIN/fullchain.pem" ]; then
  echo "Criando certificado provisório para $DOMAIN..."
  in_conf "mkdir -p /etc/letsencrypt/live/$DOMAIN && openssl req -x509 -nodes -newkey rsa:2048 -days 2 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj /CN=$DOMAIN >/dev/null 2>&1"
fi

[ "$MODE" = "--self-signed" ] && { echo "Certificado provisório pronto."; exit 0; }

# Autoassinado = emissor igual ao titular. Qualquer outro já é definitivo: não apaga nem reemite
# (evita perder o certificado em uso e gastar o limite de emissões do Let's Encrypt).
cert=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
if ! in_conf "[ \"\$(openssl x509 -noout -issuer -in $cert | sed 's/^issuer=//')\" = \"\$(openssl x509 -noout -subject -in $cert | sed 's/^subject=//')\" ]"; then
  echo "Já existe certificado definitivo para $DOMAIN; nada a fazer."
  exit 0
fi

$COMPOSE up -d nginx

# Guarda o provisório (o Nginx já o carregou) para o certbot criar a estrutura definitiva.
in_conf "rm -rf /etc/letsencrypt/provisional-$DOMAIN && mv /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/provisional-$DOMAIN"

if ! $COMPOSE run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --non-interactive; then
  echo "O certbot falhou; restaurando o certificado provisório." >&2
  in_conf "rm -rf /etc/letsencrypt/live/$DOMAIN && mv /etc/letsencrypt/provisional-$DOMAIN /etc/letsencrypt/live/$DOMAIN"
  exit 1
fi

in_conf "rm -rf /etc/letsencrypt/provisional-$DOMAIN"
$COMPOSE exec nginx nginx -s reload
echo "Certificado Let's Encrypt emitido para $DOMAIN."
