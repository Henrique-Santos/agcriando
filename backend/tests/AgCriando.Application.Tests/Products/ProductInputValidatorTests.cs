using AgCriando.Application.Products;
using AgCriando.Application.Products.Commands;
using Shouldly;

namespace AgCriando.Application.Tests.Products;

public sealed class ProductInputValidatorTests
{
    private static ProductInput Valid() => new("Caderno floral", "cadernos", 69.9m, null, null, null, null, null, null, null, null, null);

    [Fact]
    public void Valid_input_passes() =>
        new CreateProductValidator().Validate(new CreateProductCommand(Valid())).IsValid.ShouldBeTrue();

    [Fact]
    public void Reports_all_required_fields_with_spec_messages()
    {
        var result = new CreateProductValidator().Validate(new CreateProductCommand(Valid() with { Name = " ", CategoryId = null, Price = 0 }));

        result.Errors.Select(e => e.ErrorMessage).ShouldBe(
            ["Dê um nome ao produto.", "Escolha uma categoria.", "Informe um preço maior que zero."], ignoreOrder: true);
    }

    [Fact]
    public void Rejects_option_value_longer_than_40() =>
        new CreateProductValidator().Validate(new CreateProductCommand(Valid() with { OptionName = "Cor", OptionValues = [new string('a', 41)] }))
            .Errors.ShouldContain(e => e.ErrorMessage == "Use no máximo 40 caracteres.");

    [Fact]
    public void Patch_rejects_non_positive_price() =>
        new PatchProductValidator().Validate(new PatchProductCommand("x", 0, null, null))
            .Errors.Single().ErrorMessage.ShouldBe("Informe um preço maior que zero.");

    [Fact]
    public void Patch_without_price_is_valid() =>
        new PatchProductValidator().Validate(new PatchProductCommand("x", null, false, null)).IsValid.ShouldBeTrue();
}
