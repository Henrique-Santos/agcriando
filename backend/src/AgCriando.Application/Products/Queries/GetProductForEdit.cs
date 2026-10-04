using AgCriando.Application.Abstractions;
using AgCriando.Application.Catalog;
using AgCriando.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Products.Queries;

public sealed record GetProductForEditQuery(string Id) : IQuery<ProductDto>;

public sealed class GetProductForEditHandler(IAppDbContext db) : IQueryHandler<GetProductForEditQuery, ProductDto>
{
    public async Task<ProductDto> Handle(GetProductForEditQuery query, CancellationToken ct) =>
        await db.Products.AsNoTracking()
            .Where(p => p.Id == query.Id)
            .Select(ProductMappings.ToDto)
            .FirstOrDefaultAsync(ct)
        ?? throw new NotFoundException("Produto não encontrado.");
}
