using AgCriando.Application.Common;
using NetVips;

namespace AgCriando.Infrastructure.Images;

public sealed class VipsImageProcessor(long maxPixels = VipsImageProcessor.DefaultMaxPixels) : IImageProcessor
{
    public const int MaxDimension = 1200;
    public const int Quality = 82;
    public const long DefaultMaxPixels = 50_000_000;

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

    private static async Task<byte[]> ReadAllAsync(Stream input, CancellationToken ct)
    {
        using var buffer = new MemoryStream();
        await input.CopyToAsync(buffer, ct);
        return buffer.ToArray();
    }

    private static RequestValidationException Unreadable() =>
        RequestValidationException.For("file", "Não foi possível ler a imagem.");

    private static RequestValidationException TooLarge() =>
        RequestValidationException.For("file", "A imagem é grande demais. Use uma foto de até 50 megapixels.");
}
