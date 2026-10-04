using AgCriando.Infrastructure.Persistence;

namespace AgCriando.Api;

public static class ApiServices
{
    public static IServiceCollection AddApiServices(this IServiceCollection services)
    {
        services.AddHealthChecks().AddDbContextCheck<AppDbContext>();
        return services;
    }
}
