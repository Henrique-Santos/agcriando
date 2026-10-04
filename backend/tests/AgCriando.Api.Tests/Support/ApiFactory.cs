using AgCriando.Application.Common;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace AgCriando.Api.Tests.Support;

public sealed class ApiFactory(string connectionString, IDictionary<string, string?>? overrides = null)
    : WebApplicationFactory<Program>
{
    public const string AdminEmail = "admin@agcriando.test";
    public const string AdminPassword = "senha-teste-123";

    public FakeImageStorage Storage { get; } = new();
    public FakeCatalogCacheInvalidator Invalidator { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = connectionString,
            ["Database:MigrateOnStartup"] = "true",
            ["Seed:AdminEmail"] = AdminEmail,
            ["Seed:AdminPassword"] = AdminPassword,
            ["Seed:Catalog"] = "false",
            ["RateLimiting:LoginPermitLimit"] = "1000",
        };
        foreach (var (key, value) in overrides ?? new Dictionary<string, string?>())
            settings[key] = value;

        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(settings));
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IImageStorage>();
            services.AddSingleton<IImageStorage>(Storage);
            services.RemoveAll<ICatalogCacheInvalidator>();
            services.AddSingleton<ICatalogCacheInvalidator>(Invalidator);
        });
    }
}
