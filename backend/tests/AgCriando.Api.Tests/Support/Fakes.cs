using System.Collections.Concurrent;
using AgCriando.Application.Common;

namespace AgCriando.Api.Tests.Support;

public sealed class FakeImageStorage : IImageStorage
{
    public ConcurrentDictionary<string, byte[]> Saved { get; } = new();

    public Task<string> SaveAsync(string key, byte[] content, string contentType, CancellationToken ct)
    {
        Saved[key] = content;
        return Task.FromResult($"https://media.test/{key}");
    }
}

public sealed class FakeCatalogCacheInvalidator : ICatalogCacheInvalidator
{
    private int _calls;
    public int Calls => _calls;

    public Task InvalidateAsync(CancellationToken ct)
    {
        Interlocked.Increment(ref _calls);
        return Task.CompletedTask;
    }
}
