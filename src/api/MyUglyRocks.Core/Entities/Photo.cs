namespace MyUglyRocks.Core.Entities;

public enum PhotoType
{
    Before = 0,
    During = 1,
    After = 2
}

public class Photo : SoftDeletableEntity
{
    public Guid StageRunId { get; set; }
    public required string StorageKey { get; set; }
    public required string Url { get; set; }
    public string? FileName { get; set; }
    public required string MimeType { get; set; }
    public long FileSizeBytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public PhotoType PhotoType { get; set; }
    public int SortOrder { get; set; }

    // Navigation properties
    public virtual StageRun StageRun { get; set; } = null!;
}
