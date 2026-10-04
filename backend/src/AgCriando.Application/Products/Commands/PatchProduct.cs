using AgCriando.Application.Abstractions;
using AgCriando.Application.Catalog;
using AgCriando.Application.Common;
using FluentValidation;

namespace AgCriando.Application.Products.Commands;

public sealed record PatchProductCommand(string Id, decimal? Price, bool? Active, bool? Featured) : ICommand<ProductDto>, ICatalogMutation;

public sealed class PatchProductValidator : AbstractValidator<PatchProductCommand>
{
    public PatchProductValidator() => RuleFor(x => x.Price!.Value).ValidPrice().When(x => x.Price.HasValue).OverridePropertyName("price");
}

public sealed class PatchProductHandler(IAppDbContext db, TimeProvider clock) : ICommandHandler<PatchProductCommand, ProductDto>
{
    public async Task<ProductDto> Handle(PatchProductCommand command, CancellationToken ct)
    {
        var product = await ProductRules.FindAsync(db, command.Id, ct);
        var now = clock.GetUtcNow();

        if (command.Price is { } price) product.SetPrice(price, now);
        if (command.Active is { } active) product.SetActive(active, now);
        if (command.Featured is { } featured) product.SetFeatured(featured, now);

        await db.SaveChangesAsync(ct);
        return product.ToProductDto();
    }
}
