using System.Net.Http.Json;
using AgCriando.Application.Common;
using Microsoft.Extensions.Options;

namespace AgCriando.Infrastructure.Caching;

public sealed class HttpCatalogCacheInvalidator(HttpClient http, IOptions<RevalidationOptions> options) : ICatalogCacheInvalidator
{
    public async Task InvalidateAsync(CancellationToken ct)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.Url)) return;

        using var request = new HttpRequestMessage(HttpMethod.Post, settings.Url)
        {
            Content = JsonContent.Create(new { tag = "catalog" }),
        };
        request.Headers.Add("x-revalidate-secret", settings.Secret);

        using var response = await http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
    }
}
