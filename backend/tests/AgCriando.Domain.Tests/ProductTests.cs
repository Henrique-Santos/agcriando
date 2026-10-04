using AgCriando.Domain.Catalog;
using AgCriando.Domain.Common;
using Shouldly;

namespace AgCriando.Domain.Tests;

public sealed class ProductTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 4, 12, 0, 0, TimeSpan.Zero);

    private static ProductDetails Details(
        string name = "Caderno floral",
        string categoryId = "cadernos",
        decimal price = 69.9m,
        int? minQuantity = null,
        string? productionDays = null,
        string? tag = null,
        string? optionName = null,
        IReadOnlyList<string>? optionValues = null) =>
        new(name, categoryId, price, minQuantity, productionDays, tag, null, null, null,
            optionName, optionValues, null, Active: true, Featured: false);

    [Fact]
    public void Create_applies_defaults_and_trims()
    {
        var p = Product.Create("caderno-floral", Details(name: "  Caderno floral  ", tag: "   "), 3, Now);

        p.Name.ShouldBe("Caderno floral");
        p.ProductionDays.ShouldBe("5 a 7");
        p.CustomFieldLabel.ShouldBe("Personalização");
        p.CustomFieldPlaceholder.ShouldBe("");
        p.Description.ShouldBe("");
        p.Tag.ShouldBeNull();
        p.OptionName.ShouldBeNull();
        p.OptionValues.ShouldBeEmpty();
        p.SortOrder.ShouldBe(3);
        p.CreatedAt.ShouldBe(Now);
        p.UpdatedAt.ShouldBe(Now);
    }

    [Fact]
    public void Create_rejects_blank_name()
    {
        var ex = Should.Throw<DomainException>(() => Product.Create("x", Details(name: " "), 0, Now));
        ex.Field.ShouldBe("name");
        ex.Message.ShouldBe("Dê um nome ao produto.");
    }

    [Fact]
    public void Create_rejects_blank_category()
    {
        var ex = Should.Throw<DomainException>(() => Product.Create("x", Details(categoryId: ""), 0, Now));
        ex.Field.ShouldBe("categoryId");
        ex.Message.ShouldBe("Escolha uma categoria.");
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("0.004")]
    public void Create_rejects_non_positive_price(string price)
    {
        var ex = Should.Throw<DomainException>(() => Product.Create("x", Details(price: decimal.Parse(price, System.Globalization.CultureInfo.InvariantCulture)), 0, Now));
        ex.Field.ShouldBe("price");
        ex.Message.ShouldBe("Informe um preço maior que zero.");
    }

    [Fact]
    public void Create_rounds_price_to_cents()
    {
        Product.Create("x", Details(price: 69.899m), 0, Now).Price.ShouldBe(69.90m);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData(0, null)]
    [InlineData(1, null)]
    [InlineData(10, 10)]
    public void MinQuantity_below_two_means_no_minimum(int? input, int? expected)
    {
        Product.Create("x", Details(minQuantity: input), 0, Now).MinQuantity.ShouldBe(expected);
    }

    [Fact]
    public void Option_values_are_trimmed_and_deduplicated()
    {
        var p = Product.Create("x", Details(optionName: " Miolo ", optionValues: [" Pautado", "Pontilhado ", "Pautado", " "]), 0, Now);
        p.OptionName.ShouldBe("Miolo");
        p.OptionValues.ShouldBe(["Pautado", "Pontilhado"]);
    }

    [Fact]
    public void Option_is_dropped_when_values_are_empty()
    {
        var p = Product.Create("x", Details(optionName: "Miolo", optionValues: [" ", ""]), 0, Now);
        p.OptionName.ShouldBeNull();
        p.OptionValues.ShouldBeEmpty();
    }

    [Fact]
    public void Option_is_dropped_when_name_is_missing()
    {
        var p = Product.Create("x", Details(optionName: null, optionValues: ["A5", "A4"]), 0, Now);
        p.OptionName.ShouldBeNull();
        p.OptionValues.ShouldBeEmpty();
    }

    [Fact]
    public void Create_rejects_name_longer_than_120()
    {
        var ex = Should.Throw<DomainException>(() => Product.Create("x", Details(name: new string('a', 121)), 0, Now));
        ex.Field.ShouldBe("name");
        ex.Message.ShouldBe("Use no máximo 120 caracteres.");
    }

    [Fact]
    public void SetPrice_rejects_zero_and_updates_timestamp_when_valid()
    {
        var p = Product.Create("x", Details(), 0, Now);
        Should.Throw<DomainException>(() => p.SetPrice(0, Now)).Field.ShouldBe("price");

        var later = Now.AddHours(1);
        p.SetPrice(12.5m, later);
        p.Price.ShouldBe(12.5m);
        p.UpdatedAt.ShouldBe(later);
    }

    [Fact]
    public void SetActive_and_SetFeatured_update_flags()
    {
        var p = Product.Create("x", Details(), 0, Now);
        p.SetActive(false, Now);
        p.SetFeatured(true, Now);
        p.Active.ShouldBeFalse();
        p.Featured.ShouldBeTrue();
    }
}
