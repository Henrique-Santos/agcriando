#!/usr/bin/env bash
# Testa init-letsencrypt.sh: falha do certbot preserva o certificado em uso,
# e um certificado definitivo (não autoassinado) nunca é apagado nem reemitido.
set -euo pipefail
INFRA=$(cd "$(dirname "$0")/.." && pwd)
cd "$INFRA"

# Certbot falso: sempre falha (como DNS ainda não propagado ou limite de emissão).
export COMPOSE="$INFRA/tests/fake-compose-certbot-fails.sh"
cat > "$COMPOSE" <<'EOF'
#!/usr/bin/env bash
case "$*" in
  *certonly*) echo "certbot: falha simulada" >&2; exit 1 ;;
  *) exit 0 ;;
esac
EOF
chmod +x "$COMPOSE"
trap 'rm -f "$COMPOSE"' EXIT

openssl_in_docker() { docker run --rm -v "$INFRA/certbot/conf:/etc/letsencrypt" alpine:3 sh -c "apk add -q --no-cache openssl >/dev/null && $1"; }

# 1) Provisório + certbot falhando: o provisório continua no lugar.
D1=init-test-1.localhost
./scripts/init-letsencrypt.sh "$D1" dev@localhost --self-signed >/dev/null
before=$(openssl_in_docker "openssl x509 -noout -fingerprint -in /etc/letsencrypt/live/$D1/fullchain.pem")
if ./scripts/init-letsencrypt.sh "$D1" dev@localhost >/tmp/init-le-1.log 2>&1; then echo "FAIL deveria falhar com certbot falhando"; exit 1; fi
after=$(openssl_in_docker "openssl x509 -noout -fingerprint -in /etc/letsencrypt/live/$D1/fullchain.pem" || true)
[ "$before" = "$after" ] || { echo "FAIL certificado em uso foi perdido"; cat /tmp/init-le-1.log; exit 1; }

# 2) Certificado definitivo (emitido por uma CA, não autoassinado): o script não toca nele.
D2=init-test-2.localhost
openssl_in_docker "mkdir -p /etc/letsencrypt/live/$D2 && cd /tmp && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 2 -keyout ca.key -out ca.pem -subj /CN=Teste-CA >/dev/null 2>&1 && \
  openssl req -nodes -newkey rsa:2048 -keyout /etc/letsencrypt/live/$D2/privkey.pem -out leaf.csr -subj /CN=$D2 >/dev/null 2>&1 && \
  openssl x509 -req -in leaf.csr -CA ca.pem -CAkey ca.key -CAcreateserial -days 2 -out /etc/letsencrypt/live/$D2/fullchain.pem >/dev/null 2>&1"
before=$(openssl_in_docker "openssl x509 -noout -fingerprint -in /etc/letsencrypt/live/$D2/fullchain.pem")
./scripts/init-letsencrypt.sh "$D2" dev@localhost >/tmp/init-le-2.log 2>&1 || { echo "FAIL deveria sair com sucesso sem reemitir"; cat /tmp/init-le-2.log; exit 1; }
grep -qi "já existe" /tmp/init-le-2.log || { echo "FAIL não avisou que o certificado definitivo existe"; exit 1; }
after=$(openssl_in_docker "openssl x509 -noout -fingerprint -in /etc/letsencrypt/live/$D2/fullchain.pem")
[ "$before" = "$after" ] || { echo "FAIL certificado definitivo foi alterado"; exit 1; }

echo "init-letsencrypt: ok"
