# Infra — AG Criando

Produção: uma VM **Oracle Cloud Always Free** (Ampere A1, arm64, Ubuntu 24.04) com Docker Compose: Nginx, `web` (Next), `api` (.NET), Postgres 17 e backup diário. Na frente fica a **Cloudflare**: DNS, TLS e Tunnel (a VM não tem nenhuma porta de entrada aberta) e Access para o SSH. Mídia e backups ficam no **Cloudflare R2**, imagens no **GHCR**, e o deploy é feito pelo GitHub Actions após o CI passar na `main`.

**Custo:** US$ 0/mês (dentro dos limites Always Free da Oracle e dos planos gratuitos da Cloudflare, do R2 e do GitHub).

## Arquivos

| Arquivo | Para quê |
|---|---|
| `docker-compose.prod.yml` | pilha de produção |
| `docker-compose.local.yml` + `local.env` | testar a pilha de produção na máquina |
| `nginx/templates/` | Nginx (rotas `/api`, `/media`, `/`; IP real via `CF-Connecting-IP`) |
| `scripts/write-env.sh` | grava o `.env` com os segredos enviados pelo pipeline |
| `scripts/deploy.sh` | deploy de uma versão (chamado pelo pipeline) |
| `scripts/smoke.sh` | verificações de fumaça |
| `backup/` | dump diário do Postgres para o R2 |
| `oracle/cloud-init.yaml` | bootstrap da VM |
| `tests/` | testes dos scripts (`deploy`, `write-env`, `backup`) |

## Testar a pilha de produção localmente

```bash
cd infra
C="docker compose --env-file local.env -f docker-compose.prod.yml -f docker-compose.local.yml"
$C build && $C up -d db && $C run --rm migrator && $C up -d
./scripts/smoke.sh http://127.0.0.1:8080
$C down
```

Testes dos scripts: `./tests/write-env.test.sh`, `./tests/backup.test.sh` e `./tests/deploy.test.sh` (este último depois do `$C build`).

## Entrar em produção (uma vez)

### 1. Cloudflare
1. Adicione o domínio na Cloudflare (plano Free) e troque os nameservers no registro.br. Aguarde o status *Active*.
2. SSL/TLS → *Full*. Edge Certificates → *Always Use HTTPS* ligado e HSTS ligado (max-age 12 meses).
3. **R2** → crie os buckets `agcriando-media` e `agcriando-backups`.
   - `agcriando-media` → Settings → *Custom Domains* → `media.<domínio>`. Esse é o `MEDIA_BASE_URL`: `https://media.<domínio>`.
   - `agcriando-backups` → Settings → *Object lifecycle rules* → apagar objetos com mais de 30 dias.
   - *Manage R2 API Tokens* → dois tokens *Object Read & Write*: um restrito ao bucket de mídia e outro ao de backups. Anote o *Access Key ID* e o *Secret* de cada um, e o endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (esse é o `R2_ENDPOINT`).
4. **Zero Trust → Networks → Tunnels**. Se a loja ainda está no ar na AWS, deixe para criar as hostnames `<domínio>` e `www` no momento do corte (apague antes os registros `A` que apontam para o Elastic IP); a `ssh.` pode ser criada já.
    → *Create tunnel* (cloudflared) `agcriando`. Copie o token (o comando `cloudflared service install <TOKEN>`). Em *Public hostnames*:
   - `<domínio>` → `HTTP` → `localhost:8080`
   - `www.<domínio>` → `HTTP` → `localhost:8080` (com uma *Redirect Rule* de `www` para o domínio raiz)
   - `ssh.<domínio>` → `SSH` → `localhost:22`
5. **Zero Trust → Access → Service Auth** → crie um *Service Token* `github-deploy` e anote o Client ID e o Secret. Em **Access → Applications**, crie uma *Self-hosted* para `ssh.<domínio>` com uma policy *Service Auth* que inclua esse token, mais uma policy *Allow* para o seu e-mail (para acesso manual).

### 2. Oracle Cloud
1. Crie a conta e faça o **upgrade para Pay As You Go**. Contas *Free* podem ter instâncias ociosas reclamadas; no PAYG o que está nos limites Always Free continua sem custo. Em **Billing → Budgets**, crie um orçamento de US$ 1 com alerta por e-mail em 1%.
2. Gere a chave de deploy na sua máquina: `ssh-keygen -t ed25519 -f ~/.ssh/agcriando-deploy -N ''`.
3. **Compute → Instances → Create**: imagem *Canonical Ubuntu 24.04* (aarch64), shape **VM.Standard.A1.Flex** com 2 OCPU e 12 GB, boot volume de 100 GB e sub-rede pública. Em *Advanced → Management → Cloud-init*, cole `oracle/cloud-init.yaml` com `__DEPLOY_SSH_PUBKEY__` = conteúdo de `~/.ssh/agcriando-deploy.pub` e `__TUNNEL_TOKEN__` = token do passo 1.4. Se der *Out of capacity*, tente outro *availability domain* ou repita mais tarde.
4. Na *security list* da VCN, **remova a regra de entrada da porta 22** (o acesso é só pelo túnel).
5. Em alguns minutos, o túnel aparece como *Healthy* no painel da Cloudflare.
6. Na sua máquina (com `cloudflared` instalado), configure o SSH:
   ```
   Host agcriando
     HostName ssh.<domínio>
     User deploy
     IdentityFile ~/.ssh/agcriando-deploy
     ProxyCommand cloudflared access ssh --hostname %h
   ```
   Rode `ssh agcriando docker version` (abre o navegador para o login do Access). Depois, gere a linha do `known_hosts`: `ssh agcriando 'cat /etc/ssh/ssh_host_ed25519_key.pub' | awk '{print "ssh.<domínio>", $1, $2}'`.

### 3. GitHub
Settings → Environments → `production` (com *Deployment branches* restrito à `main`):
- **Variables:** `DEPLOY_HOST=ssh.<domínio>`, `DOMAIN`, `SITE_URL=https://<domínio>`, `WHATSAPP`, `ADMIN_EMAIL`, `MEDIA_BUCKET=agcriando-media`, `MEDIA_BASE_URL=https://media.<domínio>`, `BACKUP_BUCKET=agcriando-backups`, `R2_ENDPOINT`.
- **Secrets:** `SSH_PRIVATE_KEY` (conteúdo de `~/.ssh/agcriando-deploy`), `SSH_KNOWN_HOSTS` (linha do passo 2.6), `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`, `DB_PASSWORD`, `ADMIN_PASSWORD`, `REVALIDATE_SECRET` (gere com `openssl rand -hex 24`: só alfanuméricos), `MEDIA_R2_ACCESS_KEY_ID`, `MEDIA_R2_SECRET_ACCESS_KEY`, `BACKUP_R2_ACCESS_KEY_ID`, `BACKUP_R2_SECRET_ACCESS_KEY`.

Remova as variáveis antigas da AWS (`AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `ARTIFACTS_BUCKET`, `EC2_INSTANCE_ID`).

### 4. Primeiro deploy
Faça push na `main` (ou *Re-run* do workflow Deploy) e depois rode `./scripts/smoke.sh https://<domínio>` da sua máquina.

### 5. Monitoramento
**UptimeRobot** (plano Free): monitor HTTP em `https://<domínio>/api/health` a cada 5 min, com alerta por e-mail.

## Operação

- **Acesso à máquina:** `ssh agcriando`
- **Compose na VM:** `cd /opt/agcriando && docker compose --env-file .env -f docker-compose.prod.yml ps`
- **Logs:** `docker compose ... logs -f --tail 200 api` (json-file com rotação: 5 × 10 MB por container)
- **Rollback:** re-execute o workflow Deploy de um commit anterior (Actions → Deploy → run anterior → *Re-run*). O GHCR guarda as 10 últimas versões. Migrations são aditivas; não há rollback automático de schema.
- **Backup manual:** `docker compose ... exec backup sh -c '. /etc/backup.env && sh /scripts/backup.sh'`
- **Restaurar backup:**
  ```bash
  docker compose ... exec backup sh -c '. /etc/backup.env && aws s3 cp s3://$BACKUP_BUCKET/backups/<arquivo>.dump /tmp/restore.dump'
  docker compose ... stop api web
  docker compose ... exec backup sh -c '. /etc/backup.env && PGPASSWORD=$DB_PASSWORD pg_restore -h db -U agcriando -d agcriando --clean --if-exists /tmp/restore.dump'
  docker compose ... start api web
  ```
