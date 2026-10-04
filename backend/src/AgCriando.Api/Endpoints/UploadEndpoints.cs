using AgCriando.Application.Abstractions;
using AgCriando.Application.Uploads.Commands;

namespace AgCriando.Api.Endpoints;

internal static class UploadEndpoints
{
    public static RouteGroupBuilder MapUploadEndpoints(this RouteGroupBuilder admin)
    {
        admin.MapPost("/uploads", async (IFormFile file, IDispatcher dispatcher, CancellationToken ct) =>
            {
                await using var stream = file.OpenReadStream();
                return TypedResults.Ok(await dispatcher.Send(new UploadProductImageCommand(stream, file.ContentType, file.Length), ct));
            })
            .DisableAntiforgery() // proteção CSRF via SameSite=Strict + X-Requested-With
            .WithTags("Admin: Uploads");

        return admin;
    }
}
