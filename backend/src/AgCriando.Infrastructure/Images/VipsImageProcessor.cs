using System.Buffers;
using AgCriando.Application.Common;
using NetVips;

namespace AgCriando.Infrastructure.Images;

public sealed class VipsImageProcessor(
    long maxPixels = VipsImageProcessor.DefaultMaxPixels,
    long maxBytes = VipsImageProcessor.DefaultMaxBytes) : IImageProcessor
{
    public const int MaxDimension = 1200;
    public const int Quality = 82;
    public const long DefaultMaxPixels = 50_000_000;
    public const long DefaultMaxBytes = 10 * 1024 * 1024;

    // O content-type vem do cliente; o formato real é conferido pelo loader que a libvips escolheu.
    private static readonly string[] AllowedLoaders = ["jpegload_buffer", "pngload_buffer", "webpload_buffer"];

    static VipsImageProcessor()
    {
        // Cada upload é processado uma vez: o cache de operações só reteria memória.
        Cache.Max = 0;
        NetVips.NetVips.BlockUntrusted = true;
    }

    public async Task<ProcessedImage> ProcessAsync(Stream input, CancellationToken ct)
    {
        var bytes = await ReadAllAsync(input, ct);
        try
        {
            // Abrir só lê o cabeçalho: formato e tamanho são validados antes de decodificar os pixels.
            using (var header = Image.NewFromBuffer(bytes, access: Enums.Access.Sequential))
            {
                if (!AllowedLoaders.Contains(header.Get("vips-loader") as string)) throw Unreadable();
                if ((long)header.Width * header.Height > maxPixels) throw TooLarge();
            }

            // O thumbnail já decodifica reduzido (o JPEG escala no IDCT), o que limita a memória com fotos
            // de celular de 50+ MP, e aplica a orientação EXIF. Size.Down não amplia imagens pequenas.
            using var image = Image.ThumbnailBuffer(bytes, MaxDimension, height: MaxDimension, size: Enums.Size.Down);
            // Só o perfil ICC é mantido: EXIF (GPS, câmera) e XMP não vão para a imagem pública.
            var webp = image.WebpsaveBuffer(q: Quality, keep: Enums.ForeignKeep.Icc);
            return new ProcessedImage(webp, "image/webp", "webp");
        }
        catch (VipsException)
        {
            throw Unreadable();
        }
    }

    // Defesa para quem chama sem validar antes: um stream sem Length conhecido é lido em blocos até o limite.
    private async Task<byte[]> ReadAllAsync(Stream input, CancellationToken ct)
    {
        var known = input.CanSeek ? input.Length - input.Position : (long?)null;
        if (known > maxBytes) throw TooHeavy();

        using var buffer = new MemoryStream((int)(known ?? 0));
        var chunk = ArrayPool<byte>.Shared.Rent(81920);
        try
        {
            int read;
            while ((read = await input.ReadAsync(chunk, ct)) > 0)
            {
                if (buffer.Length + read > maxBytes) throw TooHeavy();
                buffer.Write(chunk, 0, read);
            }
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(chunk);
        }
        return buffer.ToArray();
    }

    private static RequestValidationException Unreadable() =>
        RequestValidationException.For("file", "Não foi possível ler a imagem.");

    private RequestValidationException TooHeavy() =>
        RequestValidationException.For("file", $"A imagem deve ter no máximo {maxBytes / (1024 * 1024)} MB.");

    private static RequestValidationException TooLarge() =>
        RequestValidationException.For("file", "A imagem é grande demais. Use uma foto de até 50 megapixels.");
}
