using AgCriando.Application.Abstractions;
using AgCriando.Application.Catalog;
using AgCriando.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Products.Queries;

public sealed record ProductListDto(IReadOnlyList<ProductDto> Items, int Total, int ActiveCount);

public sealed record ListProductsQuery(string? Search, string? CategoryId, string? Status) : IQuery<ProductListDto>;

public sealed class ListProductsHandler(IAppDbContext db) : IQueryHandler<ListProductsQuery, ProductListDto>
{
    public async Task<ProductListDto> Handle(ListProductsQuery query, CancellationToken ct)
    {
        var products = db.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            products = products.Where(p => p.Name.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(query.CategoryId) && query.CategoryId != "all")
            products = products.Where(p => p.CategoryId == query.CategoryId);

        products = query.Status switch
        {
            "on" => products.Where(p => p.Active),
            "off" => products.Where(p => !p.Active),
            _ => products,
        };

        var items = await products.OrderBy(p => p.SortOrder).ThenBy(p => p.Name).Select(ProductMappings.ToDto).ToListAsync(ct);
        var total = await db.Products.CountAsync(ct);
        var active = await db.Products.CountAsync(p => p.Active, ct);

        return new ProductListDto(items, total, active);
    }
}
