using AgCriando.Application.Abstractions;
using AgCriando.Application.Catalog;
using AgCriando.Application.Common;
using AgCriando.Domain.Catalog;
using AgCriando.Domain.Common;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Products.Commands;

public sealed record CreateProductCommand(ProductInput Input) : ICommand<ProductDto>, ICatalogMutation;

public sealed class CreateProductValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductValidator() => RuleFor(x => x.Input).NotNull().SetValidator(new ProductInputValidator());
}

public sealed class CreateProductHandler(IAppDbContext db, TimeProvider clock) : ICommandHandler<CreateProductCommand, ProductDto>
{
    public async Task<ProductDto> Handle(CreateProductCommand command, CancellationToken ct)
    {
        var details = command.Input.ToDetails();
        await ProductRules.EnsureCategoryExistsAsync(db, details.CategoryId, ct);

        var now = clock.GetUtcNow();
        var sortOrder = await db.Products.AnyAsync(ct) ? await db.Products.MinAsync(p => p.SortOrder, ct) - 1 : 0;
        var product = Product.Create(Slug.WithTimestamp(details.Name, now), details, sortOrder, now);

        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return product.ToProductDto();
    }
}
