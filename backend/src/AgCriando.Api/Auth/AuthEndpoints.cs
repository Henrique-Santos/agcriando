using System.Security.Claims;
using AgCriando.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;

namespace AgCriando.Api.Auth;

public sealed record LoginRequest(string? Email, string? Password);

public sealed record MeResponse(string Email, IReadOnlyList<string> Roles);

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth").AddEndpointFilter<RequireXRequestedWithFilter>();

        group.MapPost("/login", Login).RequireRateLimiting(AuthSetup.LoginRateLimit);

        group.MapPost("/logout", async (SignInManager<AdminUser> signIn) =>
        {
            await signIn.SignOutAsync();
            return TypedResults.NoContent();
        }).RequireAuthorization();

        group.MapGet("/me", (ClaimsPrincipal user) => TypedResults.Ok(new MeResponse(
            user.FindFirstValue(ClaimTypes.Email) ?? user.Identity!.Name!,
            user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList()))).RequireAuthorization();

        return app;
    }

    private static async Task<Results<Ok<MeResponse>, ValidationProblem, ProblemHttpResult>> Login(
        LoginRequest request, SignInManager<AdminUser> signIn, UserManager<AdminUser> users)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrEmpty(request.Password))
            return TypedResults.ValidationProblem(
                new Dictionary<string, string[]> { ["email"] = ["Preencha e-mail e senha."] },
                title: "Preencha e-mail e senha.");

        var user = await users.FindByEmailAsync(request.Email.Trim());
        if (user is null) return InvalidCredentials();

        var result = await signIn.PasswordSignInAsync(user, request.Password, isPersistent: true, lockoutOnFailure: true);
        if (result.IsLockedOut)
            return TypedResults.Problem(title: "Muitas tentativas. Tente novamente em 15 minutos.", statusCode: StatusCodes.Status423Locked);
        if (!result.Succeeded) return InvalidCredentials();

        var roles = await users.GetRolesAsync(user);
        return TypedResults.Ok(new MeResponse(user.Email!, roles.ToList()));

        static ProblemHttpResult InvalidCredentials() =>
            TypedResults.Problem(title: "E-mail ou senha incorretos.", statusCode: StatusCodes.Status401Unauthorized);
    }
}
