using AgCriando.Infrastructure.Storage;
using Amazon;
using Amazon.Runtime;
using Shouldly;

namespace AgCriando.Api.Tests;

public sealed class S3ClientFactoryTests
{
    [Fact]
    public void Without_service_url_uses_aws_region()
    {
        var config = S3ClientFactory.CreateConfig(new StorageOptions { Region = "sa-east-1" });

        config.RegionEndpoint.ShouldBe(RegionEndpoint.SAEast1);
        config.ForcePathStyle.ShouldBeFalse();
    }

    [Fact]
    public void With_service_url_targets_s3_compatible_endpoint()
    {
        var config = S3ClientFactory.CreateConfig(new StorageOptions
        {
            ServiceUrl = "https://abc123.r2.cloudflarestorage.com",
            Region = "auto",
        });

        config.ServiceURL.ShouldStartWith("https://abc123.r2.cloudflarestorage.com");
        config.AuthenticationRegion.ShouldBe("auto");
        config.ForcePathStyle.ShouldBeTrue();
        config.RequestChecksumCalculation.ShouldBe(RequestChecksumCalculation.WHEN_REQUIRED);
        config.ResponseChecksumValidation.ShouldBe(ResponseChecksumValidation.WHEN_REQUIRED);
    }
}
