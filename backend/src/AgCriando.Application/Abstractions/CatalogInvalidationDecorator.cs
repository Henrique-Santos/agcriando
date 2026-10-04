using AgCriando.Application.Common;
using Microsoft.Extensions.Logging;

namespace AgCriando.Application.Abstractions;

internal sealed class CatalogInvalidationDecorator<TCommand, TResult>(
    ICommandHandler<TCommand, TResult> inner,
    ICatalogCacheInvalidator invalidator,
    ILogger<CatalogInvalidationDecorator<TCommand, TResult>> logger) : ICommandHandler<TCommand, TResult>
    where TCommand : ICommand<TResult>
{
    public async Task<TResult> Handle(TCommand command, CancellationToken ct)
    {
        var result = await inner.Handle(command, ct);
        try
        {
            await invalidator.InvalidateAsync(ct);
        }
        catch (Exception ex)
        {
            // O ISR do front expira sozinho; a escrita já foi confirmada e não deve falhar por isso.
            logger.LogWarning(ex, "Falha ao revalidar o cache do catálogo após {Command}", typeof(TCommand).Name);
        }
        return result;
    }
}
