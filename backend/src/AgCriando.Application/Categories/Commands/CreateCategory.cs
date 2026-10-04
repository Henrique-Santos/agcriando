using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;
using AgCriando.Domain.Catalog;
using AgCriando.Domain.Common;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Categories.Commands;

public sealed record CreateCategoryCommand(string Label) : ICommand<AdminCategoryDto>, ICatalogMutation;

public sealed class CreateCategoryValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryValidator() => RuleFor(x => x.Label).ValidCategoryLabel();
}

public sealed class CreateCategoryHandler(IAppDbContext db) : ICommandHandler<CreateCategoryCommand, AdminCategoryDto>
{
    public async Task<AdminCategoryDto> Handle(CreateCategoryCommand command, CancellationToken ct)
    {
        var label = command.Label.Trim();
        await CategoryRules.EnsureUniqueLabelAsync(db, label, exceptId: null, ct);

        var existingIds = (await db.Categories.Select(c => c.Id).ToListAsync(ct)).ToHashSet();
        var baseId = Slug.From(label);
        var id = Slug.Unique(baseId.Length == 0 ? "categoria" : baseId, existingIds.Contains);
        var sortOrder = existingIds.Count == 0 ? 0 : await db.Categories.MaxAsync(c => c.SortOrder, ct) + 1;

        var category = Category.Create(id, label, sortOrder);
        db.Categories.Add(category);
        await db.SaveChangesAsync(ct);

        return new AdminCategoryDto(category.Id, category.Label, category.SortOrder, 0);
    }
}
