using AgCriando.Domain.Common;

namespace AgCriando.Domain.Catalog;

public sealed class Product
{
    public const int IdMaxLength = 160;
    public const int NameMaxLength = 120;
    public const int ProductionDaysMaxLength = 20;
    public const int TagMaxLength = 30;
    public const int DescriptionMaxLength = 1000;
    public const int CustomFieldLabelMaxLength = 60;
    public const int CustomFieldPlaceholderMaxLength = 120;
    public const int OptionNameMaxLength = 40;
    public const int OptionValueMaxLength = 40;
    public const int ImageUrlMaxLength = 500;
    public const decimal MaxPrice = 100_000_000m;
    public const string DefaultProductionDays = "5 a 7";
    public const string DefaultCustomFieldLabel = "Personalização";

    private Product() { }

    public string Id { get; private set; } = default!;
    public string Name { get; private set; } = default!;
    public string CategoryId { get; private set; } = default!;
    public decimal Price { get; private set; }
    public int? MinQuantity { get; private set; }
    public string ProductionDays { get; private set; } = default!;
    public string? Tag { get; private set; }
    public string Description { get; private set; } = default!;
    public string CustomFieldLabel { get; private set; } = default!;
    public string CustomFieldPlaceholder { get; private set; } = default!;
    public string? OptionName { get; private set; }
    public List<string> OptionValues { get; private set; } = [];
    public string? ImageUrl { get; private set; }
    public bool Active { get; private set; }
    public bool Featured { get; private set; }
    public int SortOrder { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public static Product Create(string id, ProductDetails details, int sortOrder, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        var product = new Product { Id = id, SortOrder = sortOrder, CreatedAt = now };
        product.Apply(details, now);
        return product;
    }

    public void Update(ProductDetails details, DateTimeOffset now) => Apply(details, now);

    public void SetPrice(decimal price, DateTimeOffset now)
    {
        Price = ValidPrice(price);
        UpdatedAt = now;
    }

    public void SetActive(bool active, DateTimeOffset now)
    {
        Active = active;
        UpdatedAt = now;
    }

    public void SetFeatured(bool featured, DateTimeOffset now)
    {
        Featured = featured;
        UpdatedAt = now;
    }

    private void Apply(ProductDetails d, DateTimeOffset now)
    {
        Name = Required(d.Name, NameMaxLength, "name", "Dê um nome ao produto.");
        CategoryId = Required(d.CategoryId, Category.IdMaxLength, "categoryId", "Escolha uma categoria.");
        Price = ValidPrice(d.Price);
        MinQuantity = d.MinQuantity is > 1 ? d.MinQuantity : null;
        ProductionDays = Optional(d.ProductionDays, ProductionDaysMaxLength, "productionDays") ?? DefaultProductionDays;
        Tag = Optional(d.Tag, TagMaxLength, "tag");
        Description = Optional(d.Description, DescriptionMaxLength, "description") ?? string.Empty;
        CustomFieldLabel = Optional(d.CustomFieldLabel, CustomFieldLabelMaxLength, "customFieldLabel") ?? DefaultCustomFieldLabel;
        CustomFieldPlaceholder = Optional(d.CustomFieldPlaceholder, CustomFieldPlaceholderMaxLength, "customFieldPlaceholder") ?? string.Empty;

        var optionName = Optional(d.OptionName, OptionNameMaxLength, "optionName");
        var values = (d.OptionValues ?? [])
            .Select(v => v?.Trim() ?? string.Empty)
            .Where(v => v.Length > 0)
            .Distinct()
            .ToList();
        if (values.Any(v => v.Length > OptionValueMaxLength))
            throw new DomainException($"Cada opção pode ter no máximo {OptionValueMaxLength} caracteres.", "optionValues");
        (OptionName, OptionValues) = optionName is null || values.Count == 0 ? (null, []) : (optionName, values);

        ImageUrl = Optional(d.ImageUrl, ImageUrlMaxLength, "imageUrl");
        Active = d.Active;
        Featured = d.Featured;
        UpdatedAt = now;
    }

    private static string Required(string? value, int maxLength, string field, string message) =>
        Optional(value, maxLength, field) ?? throw new DomainException(message, field);

    private static string? Optional(string? value, int maxLength, string field)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;
        if (trimmed.Length > maxLength) throw new DomainException($"Use no máximo {maxLength} caracteres.", field);
        return trimmed;
    }

    private static decimal ValidPrice(decimal price)
    {
        var rounded = decimal.Round(price, 2, MidpointRounding.AwayFromZero);
        if (rounded <= 0) throw new DomainException("Informe um preço maior que zero.", "price");
        if (rounded >= MaxPrice) throw new DomainException("Informe um preço válido.", "price");
        return rounded;
    }
}
