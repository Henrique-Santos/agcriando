using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Categories.Commands;

public sealed record ReorderCategoriesCommand(IReadOnlyList<string> Ids) : ICommand<Unit>, ICatalogMutation;

public sealed class ReorderCategoriesValidator : AbstractValidator<ReorderCategoriesCommand>
{
    public ReorderCategoriesValidator() => RuleFor(x => x.Ids).NotEmpty().WithMessage("Informe a nova ordem das categorias.");
}

public sealed class ReorderCategoriesHandler(IAppDbContext db) : ICommandHandler<ReorderCategoriesCommand, Unit>
{
    public async Task<Unit> Handle(ReorderCategoriesCommand command, CancellationToken ct)
    {
        var categories = await db.Categories.ToDictionaryAsync(c => c.Id, ct);
        var isPermutation = command.Ids.Count == categories.Count
            && command.Ids.Distinct().Count() == command.Ids.Count
            && command.Ids.All(categories.ContainsKey);
        if (!isPermutation)
            throw RequestValidationException.For("ids", "A lista deve conter todas as categorias, sem repetições.");

        for (var i = 0; i < command.Ids.Count; i++)
            categories[command.Ids[i]].MoveTo(i);

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
