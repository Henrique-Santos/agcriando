using AgCriando.Application.Common;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Memory;
using SixLabors.ImageSharp.Processing;

namespace AgCriando.Infrastructure.Images;

public sealed class ImageSharpImageProcessor(Configuration? configuration = null, long maxPixels = ImageSharpImageProcessor.DefaultMaxPixels) : IImageProcessor
{
    public const int MaxDimension = 1200;
    public const int Quality = 82;
    public const long DefaultMaxPixels = 50_000_000;

    private readonly DecoderOptions _identifyOptions = new()
    {
        Configuration = configuration ?? Configuration.Default,
        MaxFrames = 1,
    };

    public async Task<ProcessedImage> ProcessAsync(Stream input, CancellationToken ct)
    {
        var stream = input.CanSeek ? input : await BufferAsync(input, ct);
        var start = stream.Position;

        Image image;
        try
        {
            var info = await Image.IdentifyAsync(_identifyOptions, stream, ct);
            if ((long)info.Width * info.Height > maxPixels) throw TooLarge();

            // Fotos grandes já são decodificadas reduzidas (o JPEG escala no IDCT), o que limita a memória
            // com fotos de celular de 50+ MP; a caixa é quadrada, então a orientação EXIF não importa.
            // TargetSize também amplia imagens pequenas, por isso só é usado acima do limite.
            var decodeOptions = Math.Max(info.Width, info.Height) > MaxDimension
                ? new DecoderOptions
                {
                    Configuration = _identifyOptions.Configuration,
                    MaxFrames = 1,
                    TargetSize = new Size(MaxDimension, MaxDimension),
                }
                : _identifyOptions;

            stream.Position = start;
            image = await Image.LoadAsync(decodeOptions, stream, ct);
        }
        catch (ImageFormatException) // inclui UnknownImageFormatException e InvalidImageContentException
        {
            throw Unreadable();
        }
        catch (NotSupportedException)
        {
            throw Unreadable();
        }
        catch (InvalidMemoryOperationException)
        {
            throw TooLarge();
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

    private static async Task<Stream> BufferAsync(Stream input, CancellationToken ct)
    {
        var buffer = new MemoryStream();
        await input.CopyToAsync(buffer, ct);
        buffer.Position = 0;
        return buffer;
    }

    private static RequestValidationException Unreadable() =>
        RequestValidationException.For("file", "Não foi possível ler a imagem.");

    private static RequestValidationException TooLarge() =>
        RequestValidationException.For("file", "A imagem é grande demais. Use uma foto de até 50 megapixels.");
}
