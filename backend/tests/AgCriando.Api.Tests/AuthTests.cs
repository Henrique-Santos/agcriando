using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AgCriando.Api.Tests.Support;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class AuthTests(PostgresFixture postgres) : ApiTestBase(postgres)
{
    private Task<HttpResponseMessage> Login(HttpClient client, string? email, string? password) =>
        client.PostAsJsonAsync("/api/auth/login", new { email, password });

    [Fact]
    public async Task Login_with_seeded_admin_sets_session_cookie_and_returns_roles()
    {
        var response = await Login(Client, ApiFactory.AdminEmail, ApiFactory.AdminPassword);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        response.Headers.GetValues("Set-Cookie").ShouldContain(c => c.StartsWith("agc_session=") && c.Contains("httponly") && c.Contains("samesite=strict"));
        var me = await response.Content.ReadFromJsonAsync<JsonElement>();
        me.GetProperty("email").GetString().ShouldBe(ApiFactory.AdminEmail);
        me.GetProperty("roles").EnumerateArray().Select(r => r.GetString()).ShouldBe(["Admin"]);
    }

    [Fact]
    public async Task Login_accepts_email_with_different_case_and_spaces()
    {
        var response = await Login(Client, "  ADMIN@agcriando.test ", ApiFactory.AdminPassword);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Me_returns_current_user_after_login()
    {
        var admin = await CreateAdminClientAsync();
        var me = await admin.GetFromJsonAsync<JsonElement>("/api/auth/me");
        me.GetProperty("email").GetString().ShouldBe(ApiFactory.AdminEmail);
    }

    [Fact]
    public async Task Me_returns_401_without_session()
    {
        (await Client.GetAsync("/api/auth/me")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Wrong_password_returns_401_with_message()
    {
        var response = await Login(Client, ApiFactory.AdminEmail, "senha-errada-000");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("title").GetString().ShouldBe("E-mail ou senha incorretos.");
    }

    [Fact]
    public async Task Unknown_email_returns_same_401_message()
    {
        var response = await Login(Client, "ninguem@agcriando.test", "qualquer-coisa-1");
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("title").GetString().ShouldBe("E-mail ou senha incorretos.");
    }

    [Fact]
    public async Task Empty_credentials_return_400()
    {
        var response = await Login(Client, "", "");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("errors").GetProperty("email")[0].GetString().ShouldBe("Preencha e-mail e senha.");
    }

    [Fact]
    public async Task Five_failures_lock_the_account()
    {
        for (var i = 0; i < 5; i++)
            await Login(Client, ApiFactory.AdminEmail, "senha-errada-000");

        var response = await Login(Client, ApiFactory.AdminEmail, ApiFactory.AdminPassword);

        response.StatusCode.ShouldBe((HttpStatusCode)423);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("title").GetString()
            .ShouldBe("Muitas tentativas. Tente novamente em 15 minutos.");
    }

    [Fact]
    public async Task Logout_ends_the_session()
    {
        var admin = await CreateAdminClientAsync();

        (await admin.PostAsync("/api/auth/logout", null)).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await admin.GetAsync("/api/auth/me")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_without_x_requested_with_header_is_rejected()
    {
        var bare = Factory.CreateClient();
        var response = await Login(bare, ApiFactory.AdminEmail, ApiFactory.AdminPassword);
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
