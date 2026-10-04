using AgCriando.Application.Common;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace AgCriando.Infrastructure.Storage;

internal sealed class LocalImageStorage(IOptions<StorageOptions> options, IHostEnvironment environment) : IImageStorage
{
    public async Task<string> SaveAsync(string key, byte[] content, string contentType, CancellationToken ct)
    {
        var settings = options.Value;
        var path = Path.Combine(environment.ContentRootPath, settings.LocalPath, key.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await File.WriteAllBytesAsync(path, content, ct);
        return $"{settings.PublicBaseUrl.TrimEnd('/')}/{key}";
    }
}
