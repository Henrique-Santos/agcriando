# AG Criando Personalizados — loja online

Monorepo da loja da AG Criando: `backend/` (API .NET 10), `frontend/` (Next.js — em construção), `infra/` (Docker/AWS) e `design/` (export do Claude Design, só referência).

## Backend

Pré-requisitos: .NET SDK 10.0.104+ e Docker.

```bash
docker compose -f infra/docker-compose.dev.yml up -d   # Postgres em localhost:5433
cd backend
dotnet tool restore
dotnet run --project src/AgCriando.Api                 # http://localhost:5080
```

Na primeira execução em Development a API aplica as migrations, cria o admin `admin@agcriando.local` / `agcriando-dev-123` e importa o catálogo de exemplo (fotos em `backend/src/AgCriando.Api/media/`).

- OpenAPI: http://localhost:5080/openapi/v1.json (também gerado em `backend/openapi/AgCriando.Api.json` a cada build)
- Health: http://localhost:5080/api/health
- Testes: `dotnet test` (requer Docker — usa Testcontainers); um projeto só: `dotnet test --project tests/AgCriando.Domain.Tests`
- Nova migration: `dotnet ef migrations add <Nome> --project src/AgCriando.Infrastructure --startup-project src/AgCriando.Api --output-dir Persistence/Migrations`

### Configuração (variáveis de ambiente em produção)

| Chave | Descrição |
|---|---|
| `ConnectionStrings__Default` | conexão Postgres |
| `Database__MigrateOnStartup` | `false` em produção (migrations via bundle no deploy) |
| `Seed__AdminEmail` / `Seed__AdminPassword` | admin inicial (criado só se não existir) |
| `Seed__Catalog` | importa o catálogo de exemplo em banco vazio |
| `Storage__Provider` | `S3` ou `Local` |
| `Storage__Bucket` / `Storage__Region` / `Storage__PublicBaseUrl` | bucket de fotos e URL pública |
| `Revalidation__Url` / `Revalidation__Secret` | rota `/api/revalidate` do Next e segredo compartilhado |
| `RateLimiting__LoginPermitLimit` | tentativas de login por minuto por IP (padrão 10) |
