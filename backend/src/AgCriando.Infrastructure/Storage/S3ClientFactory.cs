using Amazon;
using Amazon.Runtime;
using Amazon.S3;

namespace AgCriando.Infrastructure.Storage;

public static class S3ClientFactory
{
    public static AmazonS3Config CreateConfig(StorageOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.ServiceUrl))
            return new AmazonS3Config { RegionEndpoint = RegionEndpoint.GetBySystemName(options.Region) };

        // R2 e afins: endpoint próprio, path-style e checksums só quando a operação exige
        // (os checksums padrão do SDK v4 não são aceitos por todo provedor compatível).
        return new AmazonS3Config
        {
            ServiceURL = options.ServiceUrl,
            AuthenticationRegion = options.Region,
            ForcePathStyle = true,
            RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
            ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
        };
    }
}
