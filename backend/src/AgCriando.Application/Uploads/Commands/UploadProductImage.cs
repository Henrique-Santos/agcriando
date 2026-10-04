using System.Security.Cryptography;
using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;
using FluentValidation;

namespace AgCriando.Application.Uploads.Commands;

public sealed record UploadedImageDto(string Url);

public sealed record UploadProductImageCommand(Stream Content, string? ContentType, long Length) : ICommand<UploadedImageDto>;

public sealed class UploadProductImageValidator : AbstractValidator<UploadProductImageCommand>
{
    public static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];
    public const long MaxBytes = 10 * 1024 * 1024;

    public UploadProductImageValidator()
    {
        RuleFor(x => x.ContentType)
            .Must(type => type is not null && AllowedContentTypes.Contains(type.ToLowerInvariant()))
            .WithMessage("Envie uma imagem JPG, PNG ou WebP.")
            .OverridePropertyName("file");
        RuleFor(x => x.Length)
            .GreaterThan(0).WithMessage("O arquivo está vazio.")
            .LessThanOrEqualTo(MaxBytes).WithMessage("A imagem deve ter no máximo 10 MB.")
            .OverridePropertyName("file");
    }
}

public sealed class UploadProductImageHandler(IImageProcessor processor, IImageStorage storage)
    : ICommandHandler<UploadProductImageCommand, UploadedImageDto>
{
    public async Task<UploadedImageDto> Handle(UploadProductImageCommand command, CancellationToken ct)
    {
        var image = await processor.ProcessAsync(command.Content, ct);
        var hash = Convert.ToHexStringLower(SHA256.HashData(image.Content));
        var url = await storage.SaveAsync($"products/{hash}.{image.Extension}", image.Content, image.ContentType, ct);
        return new UploadedImageDto(url);
    }
}
