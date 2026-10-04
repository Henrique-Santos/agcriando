using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;
using FluentValidation;

namespace AgCriando.Application.Categories.Commands;

public sealed record RenameCategoryCommand(string Id, string Label) : ICommand<AdminCategoryDto>, ICatalogMutation;

public sealed class RenameCategoryValidator : AbstractValidator<RenameCategoryCommand>
{
    public RenameCategoryValidator() => RuleFor(x => x.Label).ValidCategoryLabel();
}

public sealed class RenameCategoryHandler(IAppDbContext db) : ICommandHandler<RenameCategoryCommand, AdminCategoryDto>
{
    public async Task<AdminCategoryDto> Handle(RenameCategoryCommand command, CancellationToken ct)
    {
        var category = await CategoryRules.FindAsync(db, command.Id, ct);
        await CategoryRules.EnsureUniqueLabelAsync(db, command.Label, exceptId: category.Id, ct);

        category.Rename(command.Label);
        await db.SaveChangesAsync(ct);

        return new AdminCategoryDto(category.Id, category.Label, category.SortOrder,
            await CategoryRules.CountProductsAsync(db, category.Id, ct));
    }
}
