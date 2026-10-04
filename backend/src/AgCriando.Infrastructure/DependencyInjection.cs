using AgCriando.Application.Common;
using AgCriando.Infrastructure.Caching;
using AgCriando.Infrastructure.Identity;
using AgCriando.Infrastructure.Images;
using AgCriando.Infrastructure.Persistence;
using AgCriando.Infrastructure.Seeding;
using AgCriando.Infrastructure.Storage;
using Amazon;
using Amazon.S3;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace AgCriando.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);

        services.AddDbContext<AppDbContext>((sp, options) => options
            .UseNpgsql(sp.GetRequiredService<IConfiguration>().GetConnectionString("Default"))
            .UseSnakeCaseNamingConvention());
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddIdentityCore<AdminUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 10;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddSignInManager();

        services.AddOptions<SeedOptions>().BindConfiguration(SeedOptions.Section);
        services.AddScoped<ISeeder, IdentitySeeder>();

        services.AddSingleton<ICatalogCacheInvalidator, NoopCatalogCacheInvalidator>();

        services.AddOptions<StorageOptions>().BindConfiguration(StorageOptions.Section);
        services.AddSingleton<IImageProcessor, ImageSharpImageProcessor>();
        services.AddSingleton<IImageStorage>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<StorageOptions>>();
            return options.Value.IsLocal
                ? ActivatorUtilities.CreateInstance<LocalImageStorage>(sp)
                // Credenciais pela cadeia padrão da AWS (IAM Role da instância em produção).
                : new S3ImageStorage(new AmazonS3Client(RegionEndpoint.GetBySystemName(options.Value.Region)), options);
        });

        return services;
    }
}
