using System.Net;
using AgCriando.Infrastructure.Caching;
using Microsoft.Extensions.Options;
using Shouldly;

namespace AgCriando.Application.Tests.Infrastructure;

public sealed class HttpCatalogCacheInvalidatorTests
{
    private sealed class RecordingHandler(HttpStatusCode status) : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Request = request;
            Body = request.Content is null ? null : await request.Content.ReadAsStringAsync(ct);
            return new HttpResponseMessage(status);
        }
    }

    private static HttpCatalogCacheInvalidator Create(RecordingHandler handler, string url) =>
        new(new HttpClient(handler), Options.Create(new RevalidationOptions { Url = url, Secret = "s3gredo" }));

    [Fact]
    public async Task Posts_catalog_tag_with_secret_header()
    {
        var handler = new RecordingHandler(HttpStatusCode.OK);

        await Create(handler, "http://web:3000/api/revalidate").InvalidateAsync(default);

        handler.Request!.Method.ShouldBe(HttpMethod.Post);
        handler.Request.RequestUri!.ToString().ShouldBe("http://web:3000/api/revalidate");
        handler.Request.Headers.GetValues("x-revalidate-secret").ShouldBe(["s3gredo"]);
        handler.Body.ShouldBe("""{"tag":"catalog"}""");
    }

    [Fact]
    public async Task Does_nothing_without_url()
    {
        var handler = new RecordingHandler(HttpStatusCode.OK);
        await Create(handler, "").InvalidateAsync(default);
        handler.Request.ShouldBeNull();
    }

    [Fact]
    public async Task Throws_when_front_rejects()
    {
        var handler = new RecordingHandler(HttpStatusCode.Unauthorized);
        await Should.ThrowAsync<HttpRequestException>(() => Create(handler, "http://web:3000/api/revalidate").InvalidateAsync(default));
    }
}
