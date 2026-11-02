using AgCriando.Application.Abstractions;
using AgCriando.Application.Uploads.Commands;
using Microsoft.AspNetCore.Mvc;

namespace AgCriando.Api.Endpoints;

internal static class UploadEndpoints
{
    // O IFormFile lê o corpo inteiro antes do handler: o limite precisa valer já na leitura da requisição.
    // A folga cobre o boundary e os cabeçalhos do multipart, para o validador ainda responder com a mensagem amigável.
    private const long MaxRequestBytes = UploadProductImageValidator.MaxBytes + 1024 * 1024;

    public static RouteGroupBuilder MapUploadEndpoints(this RouteGroupBuilder admin)
    {
        admin.MapPost("/uploads", async (IFormFile file, IDispatcher dispatcher, CancellationToken ct) =>
            {
                await using var stream = file.OpenReadStream();
                return TypedResults.Ok(await dispatcher.Send(new UploadProductImageCommand(stream, file.ContentType, file.Length), ct));
            })
            .WithMetadata(new RequestSizeLimitAttribute(MaxRequestBytes))
            .WithFormOptions(multipartBodyLengthLimit: MaxRequestBytes)
            .DisableAntiforgery() // proteção CSRF via SameSite=Strict + X-Requested-With
            .WithTags("Admin: Uploads");

        return admin;
    }
}
