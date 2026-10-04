using AgCriando.Domain.Catalog;
using AgCriando.Domain.Common;
using Shouldly;

namespace AgCriando.Domain.Tests;

public sealed class CategoryTests
{
    [Fact]
    public void Create_trims_label()
    {
        var category = Category.Create("bottons", "  Bottons ", 2);
        category.Id.ShouldBe("bottons");
        category.Label.ShouldBe("Bottons");
        category.SortOrder.ShouldBe(2);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Rename_rejects_blank_label(string label)
    {
        var category = Category.Create("bottons", "Bottons", 0);
        var ex = Should.Throw<DomainException>(() => category.Rename(label));
        ex.Field.ShouldBe("label");
        ex.Message.ShouldBe("Digite o nome da categoria.");
    }

    [Fact]
    public void Create_rejects_label_longer_than_60()
    {
        var ex = Should.Throw<DomainException>(() => Category.Create("x", new string('a', 61), 0));
        ex.Field.ShouldBe("label");
        ex.Message.ShouldBe("Use no máximo 60 caracteres.");
    }

    [Fact]
    public void MoveTo_changes_sort_order()
    {
        var category = Category.Create("bottons", "Bottons", 0);
        category.MoveTo(5);
        category.SortOrder.ShouldBe(5);
    }
}
