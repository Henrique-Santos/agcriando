using System.Net.Http.Json;
using AgCriando.Api.Tests.Support;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class ForwardedHeadersTests(PostgresFixture postgres) : ApiTestBase(postgres)
{
    [Fact]
    public async Task Session_cookie_is_secure_behind_https_proxy()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/login")
        {
            Content = JsonContent.Create(new { email = ApiFactory.AdminEmail, password = ApiFactory.AdminPassword }),
        };
        request.Headers.Add("X-Forwarded-Proto", "https");

        var response = await Client.SendAsync(request);

        response.EnsureSuccessStatusCode();
        response.Headers.GetValues("Set-Cookie").ShouldContain(c => c.StartsWith("agc_session=") && c.Contains("secure"));
    }
}
