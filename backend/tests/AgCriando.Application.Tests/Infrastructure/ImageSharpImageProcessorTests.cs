using AgCriando.Application.Common;
using AgCriando.Infrastructure.Images;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
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
    public async Task Non_image_bytes_become_a_validation_error()
    {
        var ex = await Should.ThrowAsync<RequestValidationException>(() =>
            _processor.ProcessAsync(new MemoryStream("isto não é uma imagem"u8.ToArray()), default));
        ex.Errors["file"].ShouldBe(["Não foi possível ler a imagem."]);
    }
}
