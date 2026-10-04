# Infra — AG Criando

Produção: uma EC2 `t4g.small` (Amazon Linux 2023, arm64) com Docker Compose: Nginx + Let's Encrypt, `web` (Next), `api` (.NET), Postgres 17 e backup diário para o S3. Imagens no ECR; deploy automático pelo GitHub Actions após o CI passar na `main`.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `docker-compose.prod.yml` | pilha de produção |
| `docker-compose.aws.yml` | logs no CloudWatch (só na EC2) |
| `docker-compose.local.yml` + `local.env` | testar a pilha de produção na máquina |
| `nginx/templates/` | Nginx (TLS, rotas `/api`, `/media`, `/`) |
| `scripts/init-letsencrypt.sh` | certificado inicial |
| `scripts/render-env.sh` | `.env` a partir do SSM Parameter Store |
| `scripts/deploy.sh` | deploy de uma versão (chamado pelo pipeline) |
| `scripts/smoke.sh` | verificações de fumaça |
| `backup/` | dump diário do Postgres |
| `aws/` | provisionamento (AWS CLI) e bootstrap da EC2 |

## Testar a pilha de produção localmente

```bash
cd infra
C="docker compose --env-file local.env -f docker-compose.prod.yml -f docker-compose.local.yml"
COMPOSE=true ./scripts/init-letsencrypt.sh localhost dev@localhost --self-signed
$C build && $C up -d db && $C run --rm migrator && $C up -d
./scripts/smoke.sh https://localhost --insecure
$C down
```

## Entrar em produção (uma vez)

1. **AWS CLI** autenticado na conta certa (`aws sts get-caller-identity`).
2. `cp aws/config.env.example aws/config.env` e preencha (domínio, e-mails, região).
3. Se a conta tiver *Block Public Access* ligado no nível da conta, libere políticas públicas (`aws s3control put-public-access-block --account-id <conta> --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false`) — o bucket de mídia precisa servir `products/*`.
4. `./aws/provision.sh` — imprime o Elastic IP, as variáveis do GitHub e como ler a senha do admin.
5. **DNS:** registro `A` do domínio → Elastic IP. Aguarde propagar (`dig +short <domínio>`).
6. **GitHub:** Settings → Environments → `production`:
   - crie as variáveis impressas no passo 4;
   - em *Deployment branches*, permita só a `main` (a role da AWS confia no environment `production`; sem essa regra, qualquer branch que declare o environment poderia fazer deploy).
7. **Primeiro deploy:** faça push na `main` (ou *Re-run* do workflow Deploy). Numa instância nova o `deploy.sh` cria um certificado provisório para o Nginx subir; o health check do deploy é feito na própria máquina, então não depende de DNS nem do certificado definitivo.
8. **Certificado real**, depois que o DNS apontar para o Elastic IP (via Session Manager):
   `aws ssm start-session --target <instância>` e depois
   `cd /opt/agcriando && sudo ./scripts/init-letsencrypt.sh <domínio> <email>`.
   Pode ser reexecutado com segurança: se o certbot falhar (DNS ainda não propagado, por exemplo), o provisório volta e o site continua no ar; se o certificado definitivo já existir, nada é feito.
9. `./scripts/smoke.sh https://<domínio>` da sua máquina.

> O alarme `agcriando-health` dispara entre o provisionamento e o primeiro deploy bem-sucedido (ainda não há aplicação respondendo). É esperado.

**Custo estimado (us-east-1):** EC2 `t4g.small` ~US$ 12 + IPv4 público/Elastic IP ~US$ 3,60 + EBS 20 GB ~US$ 1,60 + S3, ECR, CloudWatch e alarmes ~US$ 1–2 ≈ **US$ 18–20/mês**.

## Operação

- **Logs:** CloudWatch Logs → grupo `/agcriando/prod` (um stream por container).
- **Acesso à máquina:** `aws ssm start-session --target <instância>` (não há SSH).
- **Comandos do compose na EC2:** `cd /opt/agcriando && sudo docker compose --env-file .env -f docker-compose.prod.yml -f docker-compose.aws.yml ps`
- **Rollback:** re-execute o workflow Deploy de um commit anterior (Actions → Deploy → run anterior → *Re-run*), ou na EC2 `sudo ./scripts/deploy.sh <sha-anterior>`. Migrations são aditivas; não há rollback automático de schema.
- **Backup manual:** `sudo docker compose ... exec backup sh -c '. /etc/backup.env && sh /scripts/backup.sh'`
- **Restaurar backup:**
  ```bash
  aws s3 cp s3://agcriando-backups-<conta>/backups/<arquivo>.dump /tmp/restore.dump
  sudo docker compose ... stop api web
  sudo docker compose ... exec -T db pg_restore -U agcriando -d agcriando --clean --if-exists < /tmp/restore.dump
  sudo docker compose ... start api web
  ```
- **Alertas:** e-mail via SNS para CPU > 80%, disco > 80%, health check falhando por 5 min; falha de hardware dispara recuperação automática da instância.
