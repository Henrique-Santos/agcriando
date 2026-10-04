namespace AgCriando.Infrastructure.Storage;

public sealed class StorageOptions
{
    public const string Section = "Storage";

    /// <summary>"S3" (produção) ou "Local" (desenvolvimento).</summary>
    public string Provider { get; set; } = "S3";
    public string Bucket { get; set; } = "";
    public string Region { get; set; } = "us-east-1";
    public string PublicBaseUrl { get; set; } = "";
    /// <summary>Pasta relativa ao ContentRoot quando Provider = Local.</summary>
    public string LocalPath { get; set; } = "media";

    public bool IsLocal => Provider.Equals("Local", StringComparison.OrdinalIgnoreCase);
}
