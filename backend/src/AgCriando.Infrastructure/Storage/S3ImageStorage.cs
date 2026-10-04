using AgCriando.Application.Common;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace AgCriando.Infrastructure.Storage;

internal sealed class S3ImageStorage(IAmazonS3 s3, IOptions<StorageOptions> options) : IImageStorage
{
    public async Task<string> SaveAsync(string key, byte[] content, string contentType, CancellationToken ct)
    {
        var settings = options.Value;
        using var stream = new MemoryStream(content);
        var request = new PutObjectRequest
        {
            BucketName = settings.Bucket,
            Key = key,
            InputStream = stream,
            ContentType = contentType,
        };
        request.Headers.CacheControl = "public, max-age=31536000, immutable";

        await s3.PutObjectAsync(request, ct);
        return $"{settings.PublicBaseUrl.TrimEnd('/')}/{key}";
    }
}
