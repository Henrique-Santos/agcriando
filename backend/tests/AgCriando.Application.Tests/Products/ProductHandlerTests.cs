using AgCriando.Application.Common;
using AgCriando.Application.Products;
using AgCriando.Application.Products.Commands;
using AgCriando.Application.Products.Queries;
using AgCriando.Application.Tests.Support;
using AgCriando.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using Shouldly;

namespace AgCriando.Application.Tests.Products;

public sealed class ProductHandlerTests
{
    private readonly FakeTimeProvider _clock = new(DateTimeOffset.FromUnixTimeMilliseconds(1790210401893));

    private static ProductInput Input(string name = "Caneca Coração", string categoryId = "canecas", decimal price = 39.9m) =>
        new(name, categoryId, price, 10, "3 a 5", "Novo", "Porcelana 325 ml.", "Nome", "Ex.: Sofia", "Alça", ["Branca", "Colorida"], null);

    private static async Task<AppDbContext> DbWithCategoriesAsync()
    {
        var db = TestDb.Create();
        db.Categories.AddRange(Make.Category("canecas"), Make.Category("cadernos"));
        await db.SaveChangesAsync();
        return db;
    }

    [Fact]
    public async Task Create_assigns_slug_id_and_puts_product_on_top()
    {
        await using var db = await DbWithCategoriesAsync();
        db.Products.Add(Make.Product("existente", "canecas", sortOrder: 0));
        await db.SaveChangesAsync();

        var dto = await new CreateProductHandler(db, _clock).Handle(new CreateProductCommand(Input()), default);

        dto.Id.ShouldBe("caneca-coracao-muet1un9");
        dto.Name.ShouldBe("Caneca Coração");
        dto.MinQuantity.ShouldBe(10);
        dto.OptionValues.ShouldBe(["Branca", "Colorida"]);
        (await db.Products.SingleAsync(p => p.Id == dto.Id)).SortOrder.ShouldBe(-1);
    }

    [Fact]
    public async Task Create_rejects_unknown_category()
    {
        await using var db = await DbWithCategoriesAsync();

        var ex = await Should.ThrowAsync<RequestValidationException>(() =>
            new CreateProductHandler(db, _clock).Handle(new CreateProductCommand(Input(categoryId: "nao-existe")), default));

        ex.Errors["categoryId"].ShouldBe(["Categoria não encontrada."]);
    }

    [Fact]
    public async Task Update_replaces_all_fields_and_keeps_id()
    {
        await using var db = await DbWithCategoriesAsync();
        db.Products.Add(Make.Product("caneca", "canecas"));
        await db.SaveChangesAsync();

        var dto = await new UpdateProductHandler(db, _clock).Handle(
            new UpdateProductCommand("caneca", Input(name: "Caneca nova", categoryId: "cadernos", price: 45m)), default);

        dto.Id.ShouldBe("caneca");
        dto.Name.ShouldBe("Caneca nova");
        dto.CategoryId.ShouldBe("cadernos");
        dto.Price.ShouldBe(45m);
    }

    [Fact]
    public async Task Update_unknown_product_throws_not_found()
    {
        await using var db = await DbWithCategoriesAsync();
        var ex = await Should.ThrowAsync<NotFoundException>(() =>
            new UpdateProductHandler(db, _clock).Handle(new UpdateProductCommand("nada", Input()), default));
        ex.Message.ShouldBe("Produto não encontrado.");
    }

    [Fact]
    public async Task Patch_changes_only_given_fields()
    {
        await using var db = await DbWithCategoriesAsync();
        db.Products.Add(Make.Product("caneca", "canecas", price: 39.9m));
        await db.SaveChangesAsync();

        var dto = await new PatchProductHandler(db, _clock).Handle(new PatchProductCommand("caneca", 42.5m, false, null), default);

        dto.Price.ShouldBe(42.5m);
        dto.Active.ShouldBeFalse();
        dto.Featured.ShouldBeFalse();
    }

    [Fact]
    public async Task Delete_removes_product()
    {
        await using var db = await DbWithCategoriesAsync();
        db.Products.Add(Make.Product("caneca", "canecas"));
        await db.SaveChangesAsync();

        await new DeleteProductHandler(db).Handle(new DeleteProductCommand("caneca"), default);

        (await db.Products.AnyAsync()).ShouldBeFalse();
    }

    [Fact]
    public async Task List_filters_by_text_category_and_status_and_reports_global_counts()
    {
        await using var db = await DbWithCategoriesAsync();
        db.Products.AddRange(
            Make.Product("c1", "canecas", sortOrder: 0, name: "Caneca de chopp"),
            Make.Product("c2", "canecas", sortOrder: 1, active: false, name: "Caneca princesa"),
            Make.Product("k1", "cadernos", sortOrder: 2, name: "Caderno floral"));
        await db.SaveChangesAsync();
        var handler = new ListProductsHandler(db);

        (await handler.Handle(new ListProductsQuery("CANECA", null, null), default)).Items.Select(p => p.Id).ShouldBe(["c1", "c2"]);
        (await handler.Handle(new ListProductsQuery(null, "cadernos", "all"), default)).Items.Select(p => p.Id).ShouldBe(["k1"]);
        (await handler.Handle(new ListProductsQuery(null, null, "off"), default)).Items.Select(p => p.Id).ShouldBe(["c2"]);

        var on = await handler.Handle(new ListProductsQuery(null, null, "on"), default);
        on.Items.Select(p => p.Id).ShouldBe(["c1", "k1"]);
        on.Total.ShouldBe(3);
        on.ActiveCount.ShouldBe(2);
    }

    [Fact]
    public async Task GetForEdit_returns_hidden_products_too()
    {
        await using var db = await DbWithCategoriesAsync();
        db.Products.Add(Make.Product("oculto", "canecas", active: false));
        await db.SaveChangesAsync();

        (await new GetProductForEditHandler(db).Handle(new GetProductForEditQuery("oculto"), default)).Active.ShouldBeFalse();
    }
}
