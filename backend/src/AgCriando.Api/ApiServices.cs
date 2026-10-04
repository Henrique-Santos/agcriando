using AgCriando.Infrastructure.Persistence;
using Microsoft.AspNetCore.HttpOverrides;

namespace AgCriando.Api;

public static class ApiServices
{
    public static IServiceCollection AddApiServices(this IServiceCollection services)
    {
        services.AddProblemDetails();
        services.AddExceptionHandler<ApiExceptionHandler>();
        services.AddHealthChecks().AddDbContextCheck<AppDbContext>();
        services.AddOpenApi();

        // A API só é alcançável pelo Nginx na rede interna do Docker; confia no proxy à frente.
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });

        return services;
    }
}
