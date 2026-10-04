using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Catalog.Queries;

public sealed record GetProductByIdQuery(string Id) : IQuery<ProductDto>;

public sealed class GetProductByIdHandler(IAppDbContext db) : IQueryHandler<GetProductByIdQuery, ProductDto>
{
    public async Task<ProductDto> Handle(GetProductByIdQuery query, CancellationToken ct) =>
        await db.Products.AsNoTracking()
            .Where(p => p.Id == query.Id && p.Active)
            .Select(ProductMappings.ToDto)
            .FirstOrDefaultAsync(ct)
        ?? throw new NotFoundException("Produto não encontrado.");
}
