namespace AgCriando.Domain.Catalog;

public sealed record ProductDetails(
    string Name,
    string CategoryId,
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
    bool Active,
    bool Featured);
