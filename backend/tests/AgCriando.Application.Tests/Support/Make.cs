using AgCriando.Domain.Catalog;
using CategoryEntity = AgCriando.Domain.Catalog.Category;
using ProductEntity = AgCriando.Domain.Catalog.Product;

namespace AgCriando.Application.Tests.Support;

internal static class Make
{
    public static readonly DateTimeOffset Now = new(2026, 10, 4, 12, 0, 0, TimeSpan.Zero);

    public static CategoryEntity Category(string id, string? label = null, int sortOrder = 0) =>
        CategoryEntity.Create(id, label ?? id, sortOrder);

    public static ProductEntity Product(string id, string categoryId = "cadernos", int sortOrder = 0,
        bool active = true, decimal price = 69.9m, string? name = null) =>
        ProductEntity.Create(id, new ProductDetails(name ?? id, categoryId, price, null, null, null, null, null, null,
            null, null, null, active, Featured: false), sortOrder, Now);
}
