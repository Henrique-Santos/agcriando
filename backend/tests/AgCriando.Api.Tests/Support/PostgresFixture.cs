using Npgsql;
using Testcontainers.PostgreSql;

namespace AgCriando.Api.Tests.Support;

public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        .Build();

    /// <summary>Cada factory recebe um banco novo; o EF cria o banco ao migrar.</summary>
    public string ConnectionStringForNewDatabase() =>
        new NpgsqlConnectionStringBuilder(_container.GetConnectionString()) { Database = $"test_{Guid.NewGuid():N}" }.ConnectionString;

    public async ValueTask InitializeAsync() => await _container.StartAsync();

    public ValueTask DisposeAsync() => _container.DisposeAsync();
}

[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "api";
}
