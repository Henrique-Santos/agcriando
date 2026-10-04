using AgCriando.Application.Common;
using AgCriando.Application.Uploads.Commands;
using NSubstitute;
using Shouldly;

namespace AgCriando.Application.Tests.Uploads;

public sealed class UploadProductImageTests
{
    [Fact]
    public async Task Saves_processed_image_under_content_hash_key()
    {
        var processor = Substitute.For<IImageProcessor>();
        var storage = Substitute.For<IImageStorage>();
        var bytes = "abc"u8.ToArray();
        processor.ProcessAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>()).Returns(new ProcessedImage(bytes, "image/webp", "webp"));
        const string key = "products/ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad.webp"; // sha256("abc")
        storage.SaveAsync(key, bytes, "image/webp", Arg.Any<CancellationToken>()).Returns("https://media.test/" + key);

        var result = await new UploadProductImageHandler(processor, storage)
            .Handle(new UploadProductImageCommand(new MemoryStream([1, 2, 3]), "image/jpeg", 3), default);

        result.Url.ShouldBe("https://media.test/" + key);
    }

    [Theory]
    [InlineData("text/plain", 100, "Envie uma imagem JPG, PNG ou WebP.")]
    [InlineData(null, 100, "Envie uma imagem JPG, PNG ou WebP.")]
    [InlineData("image/png", 0, "O arquivo está vazio.")]
    [InlineData("image/png", 10 * 1024 * 1024 + 1, "A imagem deve ter no máximo 10 MB.")]
    public void Validator_rejects_bad_files_under_the_file_field(string? contentType, long length, string message)
    {
        var result = new UploadProductImageValidator().Validate(new UploadProductImageCommand(Stream.Null, contentType, length));
        result.Errors.ShouldContain(e => e.PropertyName == "file" && e.ErrorMessage == message);
    }

    [Theory]
    [InlineData("image/jpeg")]
    [InlineData("IMAGE/PNG")]
    [InlineData("image/webp")]
    public void Validator_accepts_supported_types(string contentType) =>
        new UploadProductImageValidator().Validate(new UploadProductImageCommand(Stream.Null, contentType, 100)).IsValid.ShouldBeTrue();
}
