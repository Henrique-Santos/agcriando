using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Catalog.Queries;

public sealed record GetCatalogQuery : IQuery<CatalogDto>;

public sealed class GetCatalogHandler(IAppDbContext db) : IQueryHandler<GetCatalogQuery, CatalogDto>
{
    public async Task<CatalogDto> Handle(GetCatalogQuery query, CancellationToken ct)
    {
        var categories = await db.Categories.AsNoTracking()
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Label)
            .Select(c => new CategoryDto(c.Id, c.Label))
            .ToListAsync(ct);

        var products = await db.Products.AsNoTracking()
            .Where(p => p.Active)
            .OrderBy(p => p.SortOrder).ThenBy(p => p.Name)
            .Select(ProductMappings.ToDto)
            .ToListAsync(ct);

        return new CatalogDto(categories, products);
    }
}
