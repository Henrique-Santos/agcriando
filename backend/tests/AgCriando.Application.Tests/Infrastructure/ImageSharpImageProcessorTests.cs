using AgCriando.Application.Common;
using AgCriando.Infrastructure.Images;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Memory;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
using SixLabors.ImageSharp.PixelFormats;
using Shouldly;

namespace AgCriando.Application.Tests.Infrastructure;

public sealed class ImageSharpImageProcessorTests
{
    private readonly ImageSharpImageProcessor _processor = new();

    private static MemoryStream Jpeg(int width, int height, ushort? orientation = null)
    {
        using var image = new Image<Rgba32>(width, height);
        if (orientation is { } o)
        {
            image.Metadata.ExifProfile = new ExifProfile();
            image.Metadata.ExifProfile.SetValue(ExifTag.Orientation, o);
        }
        var stream = new MemoryStream();
        image.SaveAsJpeg(stream);
        stream.Position = 0;
        return stream;
    }

    [Fact]
    public async Task Large_image_is_reduced_to_1200px_and_converted_to_webp()
    {
        var result = await _processor.ProcessAsync(Jpeg(3000, 1500), default);

        result.ContentType.ShouldBe("image/webp");
        result.Extension.ShouldBe("webp");
        var info = Image.Identify(new MemoryStream(result.Content));
        info.Metadata.DecodedImageFormat.ShouldBe(WebpFormat.Instance);
        (info.Width, info.Height).ShouldBe((1200, 600));
    }

    [Fact]
    public async Task Small_image_is_not_upscaled()
    {
        var result = await _processor.ProcessAsync(Jpeg(300, 200), default);
        var info = Image.Identify(new MemoryStream(result.Content));
        (info.Width, info.Height).ShouldBe((300, 200));
    }

    [Fact]
    public async Task Exif_rotation_is_applied()
    {
        // Orientation 6 = girar 90° no sentido horário: 200x100 vira 100x200.
        var result = await _processor.ProcessAsync(Jpeg(200, 100, orientation: 6), default);
        var info = Image.Identify(new MemoryStream(result.Content));
        (info.Width, info.Height).ShouldBe((100, 200));
    }

    [Fact]
    public async Task Large_rotated_phone_photo_is_reduced_and_oriented()
    {
        // Retrato de celular: sensor em paisagem 4000x3000 com EXIF orientation 6.
        var result = await _processor.ProcessAsync(Jpeg(4000, 3000, orientation: 6), default);
        var info = Image.Identify(new MemoryStream(result.Content));
        (info.Width, info.Height).ShouldBe((900, 1200));
    }

    [Fact]
    public async Task Image_above_pixel_limit_is_rejected_before_decoding()
    {
        var processor = new ImageSharpImageProcessor(maxPixels: 10_000);

        var ex = await Should.ThrowAsync<RequestValidationException>(() => processor.ProcessAsync(Jpeg(200, 100), default));

        ex.Errors["file"].ShouldBe(["A imagem é grande demais. Use uma foto de até 50 megapixels."]);
    }

    [Fact]
    public async Task Memory_limit_during_decoding_becomes_a_validation_error_not_a_crash()
    {
        var configuration = Configuration.Default.Clone();
        configuration.MemoryAllocator = MemoryAllocator.Create(new MemoryAllocatorOptions { AllocationLimitMegabytes = 1 });
        var processor = new ImageSharpImageProcessor(configuration);
        using var png = new MemoryStream();
        using (var big = new Image<Rgba32>(3000, 3000)) big.SaveAsPng(png);
        png.Position = 0;

        var ex = await Should.ThrowAsync<RequestValidationException>(() => processor.ProcessAsync(png, default));

        ex.Errors.ShouldContainKey("file");
    }

    [Fact]
    public async Task Non_image_bytes_become_a_validation_error()
    {
        var ex = await Should.ThrowAsync<RequestValidationException>(() =>
            _processor.ProcessAsync(new MemoryStream("isto não é uma imagem"u8.ToArray()), default));
        ex.Errors["file"].ShouldBe(["Não foi possível ler a imagem."]);
    }
}
