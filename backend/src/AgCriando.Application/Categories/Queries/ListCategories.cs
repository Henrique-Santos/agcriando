using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Categories.Queries;

public sealed record ListCategoriesQuery : IQuery<IReadOnlyList<AdminCategoryDto>>;

public sealed class ListCategoriesHandler(IAppDbContext db) : IQueryHandler<ListCategoriesQuery, IReadOnlyList<AdminCategoryDto>>
{
    public async Task<IReadOnlyList<AdminCategoryDto>> Handle(ListCategoriesQuery query, CancellationToken ct) =>
        await db.Categories.AsNoTracking()
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Label)
            .Select(c => new AdminCategoryDto(c.Id, c.Label, c.SortOrder, db.Products.Count(p => p.CategoryId == c.Id)))
            .ToListAsync(ct);
}
