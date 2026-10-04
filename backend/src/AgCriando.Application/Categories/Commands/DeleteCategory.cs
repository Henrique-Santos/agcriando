using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;

namespace AgCriando.Application.Categories.Commands;

public sealed record DeleteCategoryCommand(string Id) : ICommand<Unit>, ICatalogMutation;

public sealed class DeleteCategoryHandler(IAppDbContext db) : ICommandHandler<DeleteCategoryCommand, Unit>
{
    public async Task<Unit> Handle(DeleteCategoryCommand command, CancellationToken ct)
    {
        var category = await CategoryRules.FindAsync(db, command.Id, ct);
        if (await CategoryRules.CountProductsAsync(db, category.Id, ct) > 0)
            throw new ConflictException("Mova ou exclua os produtos desta categoria antes.");

        db.Categories.Remove(category);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
