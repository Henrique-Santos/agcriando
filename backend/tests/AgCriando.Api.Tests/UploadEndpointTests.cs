using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AgCriando.Api.Tests.Support;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class UploadEndpointTests(PostgresFixture postgres) : ApiTestBase(postgres)
{
    private static MultipartFormDataContent File(byte[] bytes, string contentType, string name = "foto.jpg")
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "file", name } };
    }

    [Fact]
    public async Task Admin_uploads_photo_and_gets_webp_url()
    {
        var admin = await CreateAdminClientAsync();

        var response = await admin.PostAsync("/api/admin/uploads", File(TestImages.Jpeg(1600, 1200), "image/jpeg"));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var url = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("url").GetString()!;
        url.ShouldStartWith("https://media.test/products/");
        url.ShouldEndWith(".webp");
        Factory.Storage.Saved.Keys.ShouldHaveSingleItem().ShouldBe(url.Replace("https://media.test/", ""));
    }

    [Fact]
    public async Task Unsupported_type_returns_400_on_file_field()
    {
        var admin = await CreateAdminClientAsync();

        var response = await admin.PostAsync("/api/admin/uploads", File("oi"u8.ToArray(), "text/plain", "nota.txt"));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("file")[0].GetString()
            .ShouldBe("Envie uma imagem JPG, PNG ou WebP.");
    }

    [Fact]
    public async Task Fake_jpeg_returns_400_not_500()
    {
        var admin = await CreateAdminClientAsync();

        var response = await admin.PostAsync("/api/admin/uploads", File("isto não é uma imagem"u8.ToArray(), "image/jpeg"));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").GetProperty("file")[0].GetString()
            .ShouldBe("Não foi possível ler a imagem.");
        Factory.Storage.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Anonymous_upload_returns_401()
    {
        var response = await Client.PostAsync("/api/admin/uploads", File(TestImages.Jpeg(10, 10), "image/jpeg"));
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }
}
