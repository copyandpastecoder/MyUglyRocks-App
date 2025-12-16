namespace MyUglyRocks.Infrastructure.Configuration;

public class R2Settings
{
    public const string SectionName = "R2";

    public string AccountId { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string BackupBucketName { get; set; } = string.Empty;

    /// <summary>
    /// Password for AES-256 encryption of backup files.
    /// If empty, backups are stored unencrypted.
    /// </summary>
    public string BackupPassword { get; set; } = string.Empty;

    /// <summary>
    /// The R2 endpoint URL, constructed from the account ID
    /// </summary>
    public string Endpoint => $"https://{AccountId}.r2.cloudflarestorage.com";

    /// <summary>
    /// Public URL for serving images (via R2 public bucket or custom domain)
    /// </summary>
    public string PublicUrl { get; set; } = string.Empty;

    public bool IsConfigured => !string.IsNullOrEmpty(AccountId) &&
                                !string.IsNullOrEmpty(AccessKeyId) &&
                                !string.IsNullOrEmpty(SecretAccessKey) &&
                                !string.IsNullOrEmpty(BucketName);
}
