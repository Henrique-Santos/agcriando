using AgCriando.Api.Auth;

namespace AgCriando.Api.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var admin = app.MapGroup("/api/admin")
            .RequireAuthorization(AuthSetup.AdminPolicy)
            .AddEndpointFilter<RequireXRequestedWithFilter>();

        admin.MapCategoryEndpoints();
        admin.MapProductEndpoints();

        return app;
    }
}
