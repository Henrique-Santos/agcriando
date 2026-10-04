using AgCriando.Application.Abstractions;
using AgCriando.Application.Catalog;
using AgCriando.Application.Common;
using FluentValidation;

namespace AgCriando.Application.Products.Commands;

public sealed record UpdateProductCommand(string Id, ProductInput Input) : ICommand<ProductDto>, ICatalogMutation;

public sealed class UpdateProductValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductValidator() => RuleFor(x => x.Input).NotNull().SetValidator(new ProductInputValidator());
}

public sealed class UpdateProductHandler(IAppDbContext db, TimeProvider clock) : ICommandHandler<UpdateProductCommand, ProductDto>
{
    public async Task<ProductDto> Handle(UpdateProductCommand command, CancellationToken ct)
    {
        var product = await ProductRules.FindAsync(db, command.Id, ct);
        var details = command.Input.ToDetails();
        await ProductRules.EnsureCategoryExistsAsync(db, details.CategoryId, ct);

        product.Update(details, clock.GetUtcNow());
        await db.SaveChangesAsync(ct);
        return product.ToProductDto();
    }
}
