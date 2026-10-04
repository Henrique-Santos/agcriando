using System.Net;
using AgCriando.Api.Tests.Support;
using AgCriando.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class HealthTests(PostgresFixture postgres) : ApiTestBase(postgres)
{
    [Fact]
    public async Task Health_returns_200_when_database_is_reachable()
    {
        var response = await Client.GetAsync("/api/health");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Startup_applies_migrations()
    {
        _ = Factory.Server; // força a inicialização do host
        await using var scope = Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Categories.CountAsync()).ShouldBe(0);
        (await db.Database.GetPendingMigrationsAsync()).ShouldBeEmpty();
    }
}
