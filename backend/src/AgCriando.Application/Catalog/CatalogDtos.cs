using System.Linq.Expressions;
using AgCriando.Domain.Catalog;

namespace AgCriando.Application.Catalog;

public sealed record CategoryDto(string Id, string Label);

public sealed record ProductDto(
    string Id,
    string Name,
    string CategoryId,
    decimal Price,
    int? MinQuantity,
    string ProductionDays,
    string? Tag,
    string Description,
    string CustomFieldLabel,
    string CustomFieldPlaceholder,
    string? OptionName,
    IReadOnlyList<string> OptionValues,
    string? ImageUrl,
    bool Active,
    bool Featured);

public sealed record CatalogDto(IReadOnlyList<CategoryDto> Categories, IReadOnlyList<ProductDto> Products);

public static class ProductMappings
{
    public static readonly Expression<Func<Product, ProductDto>> ToDto = p => new ProductDto(
        p.Id, p.Name, p.CategoryId, p.Price, p.MinQuantity, p.ProductionDays, p.Tag, p.Description,
        p.CustomFieldLabel, p.CustomFieldPlaceholder, p.OptionName, p.OptionValues, p.ImageUrl, p.Active, p.Featured);

    private static readonly Func<Product, ProductDto> Compiled = ToDto.Compile();

    public static ProductDto ToProductDto(this Product product) => Compiled(product);
}
