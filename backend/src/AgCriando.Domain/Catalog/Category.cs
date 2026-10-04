using AgCriando.Domain.Common;

namespace AgCriando.Domain.Catalog;

public sealed class Category
{
    public const int IdMaxLength = 80;
    public const int LabelMaxLength = 60;

    private Category() { }

    public string Id { get; private set; } = default!;
    public string Label { get; private set; } = default!;
    public int SortOrder { get; private set; }

    public static Category Create(string id, string label, int sortOrder)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        return new Category { Id = id, Label = ValidLabel(label), SortOrder = sortOrder };
    }

    public void Rename(string label) => Label = ValidLabel(label);

    public void MoveTo(int sortOrder) => SortOrder = sortOrder;

    private static string ValidLabel(string? label)
    {
        var trimmed = label?.Trim() ?? string.Empty;
        if (trimmed.Length == 0) throw new DomainException("Digite o nome da categoria.", "label");
        if (trimmed.Length > LabelMaxLength) throw new DomainException($"Use no máximo {LabelMaxLength} caracteres.", "label");
        return trimmed;
    }
}
