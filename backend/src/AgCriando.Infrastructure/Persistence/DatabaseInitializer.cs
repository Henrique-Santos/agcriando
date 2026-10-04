using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AgCriando.Infrastructure.Persistence;

internal interface ISeeder
{
    Task SeedAsync(CancellationToken ct);
}

public static class DatabaseInitializer
{
    public static async Task InitializeDatabaseAsync(this IServiceProvider services, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        var provider = scope.ServiceProvider;

        if (provider.GetRequiredService<IConfiguration>().GetValue<bool>("Database:MigrateOnStartup"))
            await provider.GetRequiredService<AppDbContext>().Database.MigrateAsync(ct);

        foreach (var seeder in provider.GetServices<ISeeder>())
            await seeder.SeedAsync(ct);
    }
}
