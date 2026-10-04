#!/usr/bin/env bash
# Testa render-env.sh com um `aws` falso no PATH.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

cat > "$tmp/aws" <<'EOF'
#!/usr/bin/env bash
[ "${AWS_FAKE_EMPTY:-}" = 1 ] && exit 0
printf '/agcriando/prod/DB_PASSWORD\tabc123\n/agcriando/prod/DOMAIN\tloja.example.com\n/agcriando/prod/MEDIA_BASE_URL\thttps://b.s3.amazonaws.com/x?y=$z\n'
EOF
chmod +x "$tmp/aws"

PATH="$tmp:$PATH" "$ROOT/scripts/render-env.sh" /agcriando/prod "$tmp/out.env"

expected=$'DB_PASSWORD=\'abc123\'\nDOMAIN=\'loja.example.com\'\nMEDIA_BASE_URL=\'https://b.s3.amazonaws.com/x?y=$z\''
[ "$(cat "$tmp/out.env")" = "$expected" ] || { echo "FAIL conteúdo:"; cat "$tmp/out.env"; exit 1; }
[ "$(stat -c %a "$tmp/out.env")" = 600 ] || { echo "FAIL permissão"; exit 1; }

# Valor com $ não pode ser interpolado ao carregar o arquivo.
# shellcheck disable=SC1091,SC2016 # arquivo gerado no teste; o $z literal é proposital
( set -a; . "$tmp/out.env"; [ "$MEDIA_BASE_URL" = 'https://b.s3.amazonaws.com/x?y=$z' ] ) || { echo "FAIL interpolação"; exit 1; }

if AWS_FAKE_EMPTY=1 PATH="$tmp:$PATH" "$ROOT/scripts/render-env.sh" /agcriando/prod "$tmp/empty.env" 2>/dev/null; then
  echo "FAIL deveria falhar sem parâmetros"; exit 1
fi
[ ! -e "$tmp/empty.env" ] || { echo "FAIL não deveria criar arquivo vazio"; exit 1; }

echo "render-env: ok"
