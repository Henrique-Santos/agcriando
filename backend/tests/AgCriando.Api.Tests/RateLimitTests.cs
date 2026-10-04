using System.Net;
using System.Net.Http.Json;
using AgCriando.Api.Tests.Support;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class RateLimitTests(PostgresFixture postgres) : ApiTestBase(postgres)
{
    protected override IDictionary<string, string?> Settings =>
        new Dictionary<string, string?> { ["RateLimiting:LoginPermitLimit"] = "3" };

    [Fact]
    public async Task Login_is_rate_limited_per_client()
    {
        for (var i = 0; i < 3; i++)
            await Client.PostAsJsonAsync("/api/auth/login", new { email = "x@x.com", password = "nao-importa-1" });

        var response = await Client.PostAsJsonAsync("/api/auth/login", new { email = "x@x.com", password = "nao-importa-1" });

        response.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
    }
}
