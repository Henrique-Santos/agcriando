using AgCriando.Application.Common;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace AgCriando.Infrastructure.Images;

public sealed class ImageSharpImageProcessor : IImageProcessor
{
    public const int MaxDimension = 1200;
    public const int Quality = 82;

    public async Task<ProcessedImage> ProcessAsync(Stream input, CancellationToken ct)
    {
        Image image;
        try
        {
            image = await Image.LoadAsync(input, ct);
        }
        catch (ImageFormatException) // inclui UnknownImageFormatException e InvalidImageContentException
        {
            throw RequestValidationException.For("file", "Não foi possível ler a imagem.");
        }

        using (image)
        {
            image.Mutate(x => x.AutoOrient());
            if (image.Width > MaxDimension || image.Height > MaxDimension)
                image.Mutate(x => x.Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(MaxDimension, MaxDimension) }));

            image.Metadata.ExifProfile = null;
            image.Metadata.XmpProfile = null;

            using var output = new MemoryStream();
            await image.SaveAsWebpAsync(output, new WebpEncoder { Quality = Quality }, ct);
            return new ProcessedImage(output.ToArray(), "image/webp", "webp");
        }
    }
}
