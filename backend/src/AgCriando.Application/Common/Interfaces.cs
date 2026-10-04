using AgCriando.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace AgCriando.Application.Common;

public interface IAppDbContext
{
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public sealed record ProcessedImage(byte[] Content, string ContentType, string Extension);

public interface IImageProcessor
{
    Task<ProcessedImage> ProcessAsync(Stream input, CancellationToken ct);
}

public interface IImageStorage
{
    /// <returns>URL pública do arquivo salvo.</returns>
    Task<string> SaveAsync(string key, byte[] content, string contentType, CancellationToken ct);
}

public interface ICatalogCacheInvalidator
{
    Task InvalidateAsync(CancellationToken ct);
}
