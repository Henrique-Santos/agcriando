using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using AgCriando.Api.Tests.Support;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class ProductEndpointTests(PostgresFixture postgres) : ApiTestBase(postgres)
{
    private static object NewProduct(string name = "Caneca Coração", decimal price = 39.9m) => new
    {
        name,
        categoryId = "canecas",
        price,
        minQuantity = (int?)null,
        productionDays = "3 a 5",
        tag = "Novo",
        description = "Porcelana 325 ml.",
        customFieldLabel = "Nome ou frase",
        customFieldPlaceholder = "Ex.: Para a Sofia",
        optionName = "Alça",
        optionValues = new[] { "Branca", "Colorida" },
        imageUrl = (string?)null,
        active = true,
        featured = false,
    };

    private async Task<HttpClient> AdminWithCategoryAsync()
    {
        var admin = await CreateAdminClientAsync();
        (await admin.PostAsJsonAsync("/api/admin/categories", new { label = "Canecas" })).EnsureSuccessStatusCode();
        return admin;
    }

    private static async Task<string> CreateAsync(HttpClient admin, object body)
    {
        var response = await admin.PostAsJsonAsync("/api/admin/products", body);
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    [Fact]
    public async Task Created_product_appears_in_public_catalog_with_accents_preserved()
    {
        var admin = await AdminWithCategoryAsync();

        var id = await CreateAsync(admin, NewProduct());

        id.ShouldStartWith("caneca-coracao-");
        var product = await Client.GetFromJsonAsync<JsonElement>($"/api/catalog/products/{id}");
        product.GetProperty("name").GetString().ShouldBe("Caneca Coração");
        product.GetProperty("optionName").GetString().ShouldBe("Alça");
    }

    [Fact]
    public async Task Invalid_product_returns_errors_for_each_field()
    {
        var admin = await AdminWithCategoryAsync();

        var response = await admin.PostAsJsonAsync("/api/admin/products", NewProduct(name: "", price: 0));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        errors.GetProperty("name")[0].GetString().ShouldBe("Dê um nome ao produto.");
        errors.GetProperty("price")[0].GetString().ShouldBe("Informe um preço maior que zero.");
    }

    [Fact]
    public async Task Malformed_json_returns_400_not_500()
    {
        var admin = await AdminWithCategoryAsync();

        var response = await admin.PostAsync("/api/admin/products",
            new StringContent("{ \"name\": \"Caneca\", \"price\": ", Encoding.UTF8, "application/json"));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Hiding_product_removes_it_from_public_catalog()
    {
        var admin = await AdminWithCategoryAsync();
        var id = await CreateAsync(admin, NewProduct());

        var patch = await admin.PatchAsJsonAsync($"/api/admin/products/{id}", new { active = false });

        patch.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await Client.GetAsync($"/api/catalog/products/{id}")).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var catalog = await Client.GetFromJsonAsync<JsonElement>("/api/catalog");
        catalog.GetProperty("products").GetArrayLength().ShouldBe(0);
        var hidden = await admin.GetFromJsonAsync<JsonElement>("/api/admin/products?status=off");
        hidden.GetProperty("items")[0].GetProperty("id").GetString().ShouldBe(id);
        hidden.GetProperty("total").GetInt32().ShouldBe(1);
        hidden.GetProperty("activeCount").GetInt32().ShouldBe(0);
    }

    [Fact]
    public async Task Update_and_delete_product()
    {
        var admin = await AdminWithCategoryAsync();
        var id = await CreateAsync(admin, NewProduct());

        var put = await admin.PutAsJsonAsync($"/api/admin/products/{id}", NewProduct(name: "Caneca grande", price: 49.9m));
        put.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await put.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("price").GetDecimal().ShouldBe(49.9m);

        (await admin.DeleteAsync($"/api/admin/products/{id}")).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await admin.GetAsync($"/api/admin/products/{id}")).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
