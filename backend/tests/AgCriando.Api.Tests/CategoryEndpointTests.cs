using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AgCriando.Api.Tests.Support;
using AgCriando.Domain.Catalog;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class CategoryEndpointTests(PostgresFixture postgres) : ApiTestBase(postgres)
{
    [Fact]
    public async Task Anonymous_request_returns_401()
    {
        (await Client.GetAsync("/api/admin/categories")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task User_without_admin_role_returns_403()
    {
        var user = await CreateUserClientAsync("visitante@agcriando.test", "senha-visitante-1");
        (await user.GetAsync("/api/admin/categories")).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Admin_can_create_rename_reorder_and_delete()
    {
        var admin = await CreateAdminClientAsync();

        var created = await admin.PostAsJsonAsync("/api/admin/categories", new { label = "Canecas & potes" });
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        created.Headers.Location!.ToString().ShouldBe("/api/admin/categories/canecas-potes");
        await admin.PostAsJsonAsync("/api/admin/categories", new { label = "Bottons" });

        var renamed = await admin.PutAsJsonAsync("/api/admin/categories/canecas-potes", new { label = "Canecas" });
        renamed.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await renamed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("label").GetString().ShouldBe("Canecas");

        var reordered = await admin.PutAsJsonAsync("/api/admin/categories/order", new { ids = new[] { "bottons", "canecas-potes" } });
        reordered.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var list = await admin.GetFromJsonAsync<JsonElement>("/api/admin/categories");
        list.EnumerateArray().Select(c => c.GetProperty("id").GetString()).ShouldBe(["bottons", "canecas-potes"]);

        (await admin.DeleteAsync("/api/admin/categories/bottons")).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        Factory.Invalidator.Calls.ShouldBe(5);
    }

    [Fact]
    public async Task Duplicate_label_returns_validation_problem()
    {
        var admin = await CreateAdminClientAsync();
        await admin.PostAsJsonAsync("/api/admin/categories", new { label = "Bottons" });

        var response = await admin.PostAsJsonAsync("/api/admin/categories", new { label = "bottons" });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("errors").GetProperty("label")[0].GetString().ShouldBe("Já existe uma categoria com esse nome.");
    }

    [Fact]
    public async Task Deleting_category_with_hidden_products_returns_409()
    {
        await SeedAsync(db =>
        {
            db.Categories.Add(Category.Create("cadernos", "Cadernos", 0));
            db.Products.Add(Product.Create("oculto", new ProductDetails("Oculto", "cadernos", 10m, null, null, null, null, null, null,
                null, null, null, Active: false, Featured: false), 0, DateTimeOffset.UtcNow));
            return Task.CompletedTask;
        });
        var admin = await CreateAdminClientAsync();

        var response = await admin.DeleteAsync("/api/admin/categories/cadernos");

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("title").GetString()
            .ShouldBe("Mova ou exclua os produtos desta categoria antes.");
    }

    [Fact]
    public async Task Write_without_x_requested_with_header_returns_400()
    {
        var admin = await CreateAdminClientAsync();
        admin.DefaultRequestHeaders.Remove("X-Requested-With");

        var response = await admin.PostAsJsonAsync("/api/admin/categories", new { label = "Bottons" });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }
}
