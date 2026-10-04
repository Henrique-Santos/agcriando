using AgCriando.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace AgCriando.Api.Tests.Support;

[Collection(ApiCollection.Name)]
public abstract class ApiTestBase(PostgresFixture postgres) : IAsyncLifetime
{
    protected ApiFactory Factory { get; private set; } = default!;
    protected HttpClient Client { get; private set; } = default!;

    protected virtual IDictionary<string, string?>? Settings => null;

    public ValueTask InitializeAsync()
    {
        Factory = new ApiFactory(postgres.ConnectionStringForNewDatabase(), Settings);
        Client = CreateClient();
        return ValueTask.CompletedTask;
    }

    protected HttpClient CreateClient()
    {
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Requested-With", "fetch");
        return client;
    }

    protected async Task SeedAsync(Func<AppDbContext, Task> seed)
    {
        await using var scope = Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await seed(db);
        await db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        Client.Dispose();
        await Factory.DisposeAsync();
    }
}
