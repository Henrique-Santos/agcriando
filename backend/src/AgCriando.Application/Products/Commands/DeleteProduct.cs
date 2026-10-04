using AgCriando.Application.Abstractions;
using AgCriando.Application.Common;

namespace AgCriando.Application.Products.Commands;

public sealed record DeleteProductCommand(string Id) : ICommand<Unit>, ICatalogMutation;

public sealed class DeleteProductHandler(IAppDbContext db) : ICommandHandler<DeleteProductCommand, Unit>
{
    public async Task<Unit> Handle(DeleteProductCommand command, CancellationToken ct)
    {
        var product = await ProductRules.FindAsync(db, command.Id, ct);
        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
