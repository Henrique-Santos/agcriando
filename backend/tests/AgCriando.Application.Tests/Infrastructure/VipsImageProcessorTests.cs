using AgCriando.Application.Common;
using AgCriando.Infrastructure.Images;
using NetVips;
using Shouldly;

namespace AgCriando.Application.Tests.Infrastructure;

public sealed class VipsImageProcessorTests
{
    private readonly VipsImageProcessor _processor = new();

    private static MemoryStream Jpeg(int width, int height, int? orientation = null)
    {
        using var image = Image.Black(width, height, bands: 3);
        using var oriented = orientation is { } o ? image.Mutate(m => m.Set(GValue.GIntType, "orientation", o)) : image.Copy();
        return new MemoryStream(oriented.JpegsaveBuffer());
    }

    private static Image Decode(ProcessedImage result) => Image.NewFromBuffer(result.Content);

    [Fact]
    public async Task Large_image_is_reduced_to_1200px_and_converted_to_webp()
    {
        var result = await _processor.ProcessAsync(Jpeg(3000, 1500), Ct);

        result.ContentType.ShouldBe("image/webp");
        result.Extension.ShouldBe("webp");
        using var info = Decode(result);
        info.Get("vips-loader").ShouldBe("webpload_buffer");
        (info.Width, info.Height).ShouldBe((1200, 600));
    }

    [Fact]
    public async Task Small_image_is_not_upscaled()
    {
        var result = await _processor.ProcessAsync(Jpeg(300, 200), Ct);
        using var info = Decode(result);
        (info.Width, info.Height).ShouldBe((300, 200));
    }

    [Fact]
    public async Task Exif_rotation_is_applied()
    {
        // Orientation 6 = girar 90° no sentido horário: 200x100 vira 100x200.
        var result = await _processor.ProcessAsync(Jpeg(200, 100, orientation: 6), Ct);
        using var info = Decode(result);
        (info.Width, info.Height).ShouldBe((100, 200));
    }

    [Fact]
    public async Task Large_rotated_phone_photo_is_reduced_and_oriented()
    {
        // Retrato de celular: sensor em paisagem 4000x3000 com EXIF orientation 6.
        var result = await _processor.ProcessAsync(Jpeg(4000, 3000, orientation: 6), Ct);
        using var info = Decode(result);
        (info.Width, info.Height).ShouldBe((900, 1200));
    }

    [Fact]
    public async Task Exif_is_stripped_from_the_output()
    {
        var result = await _processor.ProcessAsync(Jpeg(200, 100, orientation: 6), Ct);
        using var info = Decode(result);
        info.GetFields().ShouldNotContain("exif-data");
    }

    [Fact]
    public async Task Image_above_pixel_limit_is_rejected_before_decoding()
    {
        var processor = new VipsImageProcessor(maxPixels: 10_000);

        var ex = await Should.ThrowAsync<RequestValidationException>(() => processor.ProcessAsync(Jpeg(200, 100), Ct));

        ex.Errors["file"].ShouldBe(["A imagem é grande demais. Use uma foto de até 50 megapixels."]);
    }

    [Fact]
    public async Task Format_outside_the_upload_whitelist_is_rejected()
    {
        // GIF é um formato que a libvips lê, mas o upload só aceita JPG, PNG e WebP.
        using var image = Image.Black(10, 10, bands: 3);
        var gif = new MemoryStream(image.GifsaveBuffer());

        var ex = await Should.ThrowAsync<RequestValidationException>(() => _processor.ProcessAsync(gif, Ct));

        ex.Errors["file"].ShouldBe(["Não foi possível ler a imagem."]);
    }

    [Fact]
    public async Task Non_image_bytes_become_a_validation_error()
    {
        var ex = await Should.ThrowAsync<RequestValidationException>(() =>
            _processor.ProcessAsync(new MemoryStream("isto não é uma imagem"u8.ToArray()), Ct));
        ex.Errors["file"].ShouldBe(["Não foi possível ler a imagem."]);
    }
}
