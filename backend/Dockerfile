# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY global.json AgCriando.slnx dotnet-tools.json ./
COPY src/AgCriando.Domain/AgCriando.Domain.csproj src/AgCriando.Domain/
COPY src/AgCriando.Application/AgCriando.Application.csproj src/AgCriando.Application/
COPY src/AgCriando.Infrastructure/AgCriando.Infrastructure.csproj src/AgCriando.Infrastructure/
COPY src/AgCriando.Api/AgCriando.Api.csproj src/AgCriando.Api/
RUN dotnet restore src/AgCriando.Api/AgCriando.Api.csproj && dotnet tool restore
COPY src/ src/
RUN dotnet publish src/AgCriando.Api/AgCriando.Api.csproj -c Release -o /app --no-restore -p:OpenApiGenerateDocuments=false

FROM build AS bundle
RUN dotnet ef migrations bundle \
      --project src/AgCriando.Infrastructure --startup-project src/AgCriando.Api \
      --configuration Release --self-contained --output /efbundle

# Executa as migrations: docker run agcriando-migrator --connection "Host=db;..."
FROM mcr.microsoft.com/dotnet/runtime-deps:10.0 AS migrator
COPY --from=bundle /efbundle /efbundle
USER $APP_UID
ENTRYPOINT ["/efbundle"]

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .
RUN mkdir -p /app/media && chown "$APP_UID" /app/media
USER $APP_UID
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "AgCriando.Api.dll"]
