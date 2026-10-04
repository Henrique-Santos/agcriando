using System.Net.Http.Json;
using System.Text.Json;
using AgCriando.Api.Tests.Support;
using AgCriando.Infrastructure.Persistence;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class CatalogSeedTests(PostgresFixture postgres) : ApiTestBase(postgres)
{
    protected override IDictionary<string, string?> Settings =>
        new Dictionary<string, string?> { ["Seed:Catalog"] = "true" };

    [Fact]
    public async Task Imports_design_catalog_with_photos()
    {
        var catalog = await Client.GetFromJsonAsync<JsonElement>("/api/catalog");

        var categories = catalog.GetProperty("categories");
        categories.GetArrayLength().ShouldBe(9);
        categories[0].GetProperty("id").GetString().ShouldBe("cadernos");

        var products = catalog.GetProperty("products").EnumerateArray().ToList();
        products.Count.ShouldBe(21);
        var floral = products.Single(p => p.GetProperty("id").GetString() == "caderno-floral");
        floral.GetProperty("optionName").GetString().ShouldBe("Miolo");
        floral.GetProperty("optionValues").GetArrayLength().ShouldBe(3);
        floral.GetProperty("tag").GetString().ShouldBe("Mais pedido");
        floral.GetProperty("imageUrl").GetString()!.ShouldStartWith("https://media.test/products/");
        products.Single(p => p.GetProperty("id").GetString() == "topo-bolo").GetProperty("imageUrl").ValueKind.ShouldBe(JsonValueKind.Null);
        products.Count(p => p.GetProperty("featured").GetBoolean()).ShouldBe(8);
        Factory.Storage.Saved.Count.ShouldBe(19);
    }

    [Fact]
    public async Task Running_initialization_again_does_not_duplicate()
    {
        _ = Factory.Server;
        await Factory.Services.InitializeDatabaseAsync();

        var catalog = await Client.GetFromJsonAsync<JsonElement>("/api/catalog");
        catalog.GetProperty("products").GetArrayLength().ShouldBe(21);
    }
}
