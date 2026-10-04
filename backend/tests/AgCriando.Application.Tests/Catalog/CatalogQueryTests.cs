using AgCriando.Application.Catalog.Queries;
using AgCriando.Application.Common;
using AgCriando.Application.Tests.Support;
using Shouldly;

namespace AgCriando.Application.Tests.Catalog;

public sealed class CatalogQueryTests
{
    [Fact]
    public async Task GetCatalog_returns_ordered_categories_and_only_active_products()
    {
        await using var db = TestDb.Create();
        db.Categories.AddRange(Make.Category("canecas", "Canecas", 1), Make.Category("cadernos", "Cadernos", 0));
        db.Products.AddRange(
            Make.Product("b", "cadernos", sortOrder: 1),
            Make.Product("a", "cadernos", sortOrder: 0),
            Make.Product("oculto", "canecas", active: false));
        await db.SaveChangesAsync();

        var catalog = await new GetCatalogHandler(db).Handle(new GetCatalogQuery(), default);

        catalog.Categories.Select(c => c.Id).ShouldBe(["cadernos", "canecas"]);
        catalog.Products.Select(p => p.Id).ShouldBe(["a", "b"]);
    }

    [Fact]
    public async Task GetProductById_returns_active_product()
    {
        await using var db = TestDb.Create();
        db.Products.Add(Make.Product("caderno-floral", name: "Caderno floral"));
        await db.SaveChangesAsync();

        var dto = await new GetProductByIdHandler(db).Handle(new GetProductByIdQuery("caderno-floral"), default);

        dto.Name.ShouldBe("Caderno floral");
        dto.Price.ShouldBe(69.9m);
    }

    [Fact]
    public async Task GetProductById_hides_inactive_products()
    {
        await using var db = TestDb.Create();
        db.Products.Add(Make.Product("oculto", active: false));
        await db.SaveChangesAsync();

        var ex = await Should.ThrowAsync<NotFoundException>(() =>
            new GetProductByIdHandler(db).Handle(new GetProductByIdQuery("oculto"), default));
        ex.Message.ShouldBe("Produto não encontrado.");
    }
}
