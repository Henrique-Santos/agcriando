using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AgCriando.Api.Tests.Support;
using AgCriando.Domain.Catalog;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class CatalogEndpointTests(PostgresFixture postgres) : ApiTestBase(postgres)
{
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    private Task SeedCatalogAsync() => SeedAsync(db =>
    {
        db.Categories.Add(Category.Create("cadernos", "Cadernos & planners", 0));
        db.Products.Add(Product.Create("caderno-floral", new ProductDetails(
            "Caderno floral com nome", "cadernos", 69.9m, null, "5 a 7", "Mais pedido", "Capa dura.", "Nome na capa", "Ex.: Emelli",
            "Miolo", ["Pautado", "Pontilhado"], null, Active: true, Featured: true), 0, Now));
        db.Products.Add(Product.Create("oculto", new ProductDetails(
            "Oculto", "cadernos", 10m, null, null, null, null, null, null, null, null, null, Active: false, Featured: false), 1, Now));
        return Task.CompletedTask;
    });

    [Fact]
    public async Task Get_catalog_returns_categories_and_active_products_in_camel_case()
    {
        await SeedCatalogAsync();

        var json = await Client.GetFromJsonAsync<JsonElement>("/api/catalog");

        json.GetProperty("categories")[0].GetProperty("label").GetString().ShouldBe("Cadernos & planners");
        var products = json.GetProperty("products");
        products.GetArrayLength().ShouldBe(1);
        var product = products[0];
        product.GetProperty("id").GetString().ShouldBe("caderno-floral");
        product.GetProperty("price").GetDecimal().ShouldBe(69.9m);
        product.GetProperty("optionValues").EnumerateArray().Select(v => v.GetString()).ShouldBe(["Pautado", "Pontilhado"]);
        product.GetProperty("featured").GetBoolean().ShouldBeTrue();
    }

    [Fact]
    public async Task Get_product_returns_404_problem_details_for_hidden_product()
    {
        await SeedCatalogAsync();

        var response = await Client.GetAsync("/api/catalog/products/oculto");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType!.MediaType.ShouldBe("application/problem+json");
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("title").GetString().ShouldBe("Produto não encontrado.");
    }
}
