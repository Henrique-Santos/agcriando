using AgCriando.Application.Categories;
using AgCriando.Application.Categories.Commands;
using AgCriando.Application.Categories.Queries;
using AgCriando.Application.Common;
using AgCriando.Application.Tests.Support;
using Microsoft.EntityFrameworkCore;
using Shouldly;

namespace AgCriando.Application.Tests.Categories;

public sealed class CategoryHandlerTests
{
    [Fact]
    public async Task Create_generates_slug_and_appends_to_the_end()
    {
        await using var db = TestDb.Create();
        db.Categories.Add(Make.Category("cadernos", "Cadernos", 0));
        await db.SaveChangesAsync();

        var dto = await new CreateCategoryHandler(db).Handle(new CreateCategoryCommand("  Topos de bolo "), default);

        dto.ShouldBe(new AdminCategoryDto("topos-de-bolo", "Topos de bolo", 1, 0));
    }

    [Fact]
    public async Task Create_rejects_duplicate_label_ignoring_case()
    {
        await using var db = TestDb.Create();
        db.Categories.Add(Make.Category("bottons", "Bottons", 0));
        await db.SaveChangesAsync();

        var ex = await Should.ThrowAsync<RequestValidationException>(() =>
            new CreateCategoryHandler(db).Handle(new CreateCategoryCommand("BOTTONS"), default));

        ex.Errors["label"].ShouldBe(["Já existe uma categoria com esse nome."]);
    }

    [Fact]
    public async Task Create_adds_suffix_when_slug_is_taken()
    {
        await using var db = TestDb.Create();
        db.Categories.Add(Make.Category("bottons", "Bottons antigos", 0));
        await db.SaveChangesAsync();

        var dto = await new CreateCategoryHandler(db).Handle(new CreateCategoryCommand("Bottons"), default);

        dto.Id.ShouldBe("bottons-2");
    }

    [Fact]
    public async Task Create_uses_fallback_id_when_label_has_no_letters()
    {
        await using var db = TestDb.Create();
        var dto = await new CreateCategoryHandler(db).Handle(new CreateCategoryCommand("★★★"), default);
        dto.Id.ShouldBe("categoria");
    }

    [Fact]
    public async Task Rename_allows_changing_case_of_own_label()
    {
        await using var db = TestDb.Create();
        db.Categories.Add(Make.Category("bottons", "bottons", 0));
        await db.SaveChangesAsync();

        var dto = await new RenameCategoryHandler(db).Handle(new RenameCategoryCommand("bottons", "Bottons"), default);

        dto.Label.ShouldBe("Bottons");
        dto.Id.ShouldBe("bottons");
    }

    [Fact]
    public async Task Rename_rejects_label_used_by_another_category()
    {
        await using var db = TestDb.Create();
        db.Categories.AddRange(Make.Category("bottons", "Bottons", 0), Make.Category("canecas", "Canecas", 1));
        await db.SaveChangesAsync();

        var ex = await Should.ThrowAsync<RequestValidationException>(() =>
            new RenameCategoryHandler(db).Handle(new RenameCategoryCommand("canecas", "bottons"), default));
        ex.Errors.ShouldContainKey("label");
    }

    [Fact]
    public async Task Rename_unknown_category_throws_not_found()
    {
        await using var db = TestDb.Create();
        var ex = await Should.ThrowAsync<NotFoundException>(() =>
            new RenameCategoryHandler(db).Handle(new RenameCategoryCommand("nada", "Nada"), default));
        ex.Message.ShouldBe("Categoria não encontrada.");
    }

    [Fact]
    public async Task Reorder_sets_sort_order_from_list_position()
    {
        await using var db = TestDb.Create();
        db.Categories.AddRange(Make.Category("a", sortOrder: 0), Make.Category("b", sortOrder: 1), Make.Category("c", sortOrder: 2));
        await db.SaveChangesAsync();

        await new ReorderCategoriesHandler(db).Handle(new ReorderCategoriesCommand(["c", "a", "b"]), default);

        (await db.Categories.OrderBy(c => c.SortOrder).Select(c => c.Id).ToListAsync()).ShouldBe(["c", "a", "b"]);
    }

    [Theory]
    [InlineData("a,b")]
    [InlineData("a,b,b")]
    [InlineData("a,b,x")]
    public async Task Reorder_rejects_list_that_is_not_a_permutation(string csv)
    {
        var ids = csv.Split(',');
        await using var db = TestDb.Create();
        db.Categories.AddRange(Make.Category("a", sortOrder: 0), Make.Category("b", sortOrder: 1), Make.Category("c", sortOrder: 2));
        await db.SaveChangesAsync();

        var ex = await Should.ThrowAsync<RequestValidationException>(() =>
            new ReorderCategoriesHandler(db).Handle(new ReorderCategoriesCommand(ids), default));
        ex.Errors["ids"].ShouldBe(["A lista deve conter todas as categorias, sem repetições."]);
    }

    [Fact]
    public async Task Delete_is_blocked_while_category_has_products_even_hidden_ones()
    {
        await using var db = TestDb.Create();
        db.Categories.Add(Make.Category("cadernos"));
        db.Products.Add(Make.Product("oculto", "cadernos", active: false));
        await db.SaveChangesAsync();

        var ex = await Should.ThrowAsync<ConflictException>(() =>
            new DeleteCategoryHandler(db).Handle(new DeleteCategoryCommand("cadernos"), default));
        ex.Message.ShouldBe("Mova ou exclua os produtos desta categoria antes.");
    }

    [Fact]
    public async Task Delete_removes_empty_category()
    {
        await using var db = TestDb.Create();
        db.Categories.Add(Make.Category("vazia"));
        await db.SaveChangesAsync();

        await new DeleteCategoryHandler(db).Handle(new DeleteCategoryCommand("vazia"), default);

        (await db.Categories.AnyAsync()).ShouldBeFalse();
    }

    [Fact]
    public async Task List_returns_categories_with_product_counts()
    {
        await using var db = TestDb.Create();
        db.Categories.AddRange(Make.Category("b", "B", 1), Make.Category("a", "A", 0));
        db.Products.AddRange(Make.Product("p1", "a"), Make.Product("p2", "a", active: false));
        await db.SaveChangesAsync();

        var list = await new ListCategoriesHandler(db).Handle(new ListCategoriesQuery(), default);

        list.Select(c => (c.Id, c.ProductCount)).ShouldBe([("a", 2), ("b", 0)]);
    }
}
