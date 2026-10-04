using System.Net.Http.Json;
using AgCriando.Infrastructure.Identity;
using AgCriando.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
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

    protected async Task<HttpClient> CreateAdminClientAsync() =>
        await LoginAsync(ApiFactory.AdminEmail, ApiFactory.AdminPassword);

    protected async Task<HttpClient> CreateUserClientAsync(string email, string password)
    {
        await using (var scope = Factory.Services.CreateAsyncScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<AdminUser>>();
            var result = await users.CreateAsync(new AdminUser { UserName = email, Email = email }, password);
            if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));
        }
        return await LoginAsync(email, password);
    }

    private async Task<HttpClient> LoginAsync(string email, string password)
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        return client;
    }

    public async ValueTask DisposeAsync()
    {
        Client.Dispose();
        await Factory.DisposeAsync();
    }
}
