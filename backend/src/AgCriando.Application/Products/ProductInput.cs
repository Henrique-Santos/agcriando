using AgCriando.Application.Common;
using AgCriando.Domain.Catalog;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Products;

public sealed record ProductInput(
    string? Name,
    string? CategoryId,
    decimal Price,
    int? MinQuantity,
    string? ProductionDays,
    string? Tag,
    string? Description,
    string? CustomFieldLabel,
    string? CustomFieldPlaceholder,
    string? OptionName,
    IReadOnlyList<string>? OptionValues,
    string? ImageUrl,
    bool Active = true,
    bool Featured = false)
{
    public ProductDetails ToDetails() => new(Name ?? "", CategoryId ?? "", Price, MinQuantity, ProductionDays, Tag,
        Description, CustomFieldLabel, CustomFieldPlaceholder, OptionName, OptionValues, ImageUrl, Active, Featured);
}

public sealed class ProductInputValidator : AbstractValidator<ProductInput>
{
    public ProductInputValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Dê um nome ao produto.")
            .MaximumLength(Product.NameMaxLength).WithMessage(TooLong(Product.NameMaxLength));
        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("Escolha uma categoria.");
        RuleFor(x => x.Price).ValidPrice();
        RuleFor(x => x.MinQuantity).GreaterThanOrEqualTo(0).When(x => x.MinQuantity.HasValue)
            .WithMessage("Informe uma quantidade mínima válida.");
        RuleFor(x => x.ProductionDays).MaximumLength(Product.ProductionDaysMaxLength).WithMessage(TooLong(Product.ProductionDaysMaxLength));
        RuleFor(x => x.Tag).MaximumLength(Product.TagMaxLength).WithMessage(TooLong(Product.TagMaxLength));
        RuleFor(x => x.Description).MaximumLength(Product.DescriptionMaxLength).WithMessage(TooLong(Product.DescriptionMaxLength));
        RuleFor(x => x.CustomFieldLabel).MaximumLength(Product.CustomFieldLabelMaxLength).WithMessage(TooLong(Product.CustomFieldLabelMaxLength));
        RuleFor(x => x.CustomFieldPlaceholder).MaximumLength(Product.CustomFieldPlaceholderMaxLength).WithMessage(TooLong(Product.CustomFieldPlaceholderMaxLength));
        RuleFor(x => x.OptionName).MaximumLength(Product.OptionNameMaxLength).WithMessage(TooLong(Product.OptionNameMaxLength));
        RuleFor(x => x.OptionValues).Must(v => v is null || v.Count <= 20).WithMessage("Use no máximo 20 opções.");
        RuleForEach(x => x.OptionValues).MaximumLength(Product.OptionValueMaxLength).WithMessage(TooLong(Product.OptionValueMaxLength))
            .OverridePropertyName("optionValues");
        RuleFor(x => x.ImageUrl).MaximumLength(Product.ImageUrlMaxLength).WithMessage(TooLong(Product.ImageUrlMaxLength));
    }

    private static string TooLong(int max) => $"Use no máximo {max} caracteres.";
}

internal static class ProductRules
{
    public static IRuleBuilderOptions<T, decimal> ValidPrice<T>(this IRuleBuilder<T, decimal> rule) =>
        rule.GreaterThan(0).WithMessage("Informe um preço maior que zero.")
            .LessThan(Product.MaxPrice).WithMessage("Informe um preço válido.");

    public static async Task EnsureCategoryExistsAsync(IAppDbContext db, string categoryId, CancellationToken ct)
    {
        if (!await db.Categories.AnyAsync(c => c.Id == categoryId, ct))
            throw RequestValidationException.For("categoryId", "Categoria não encontrada.");
    }

    public static async Task<Product> FindAsync(IAppDbContext db, string id, CancellationToken ct) =>
        await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct)
        ?? throw new NotFoundException("Produto não encontrado.");
}
