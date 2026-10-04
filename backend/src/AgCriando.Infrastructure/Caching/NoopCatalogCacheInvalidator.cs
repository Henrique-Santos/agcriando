using AgCriando.Application.Common;

namespace AgCriando.Infrastructure.Caching;

internal sealed class NoopCatalogCacheInvalidator : ICatalogCacheInvalidator
{
    public Task InvalidateAsync(CancellationToken ct) => Task.CompletedTask;
}
