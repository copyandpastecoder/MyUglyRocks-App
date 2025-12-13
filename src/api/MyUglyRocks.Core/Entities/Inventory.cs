namespace MyUglyRocks.Core.Entities;

public enum SourceType
{
    Store = 0,      // Physical retail store
    Online = 1,     // Online purchase
    Found = 2,      // Collected in the wild
    Gift = 3,       // Received as gift
    Trade = 4,      // Traded with another collector
    Other = 5       // Other source
}

public enum InventoryCondition
{
    Raw = 0,        // Unprocessed, as found/purchased
    PreShaped = 1,  // Pre-shaped but not tumbled
    Tumbled = 2,    // Already tumbled (buying finished rocks)
    Polished = 3,   // Fully polished
    Mixed = 4       // Mix of conditions
}

public enum InventoryStatus
{
    Available = 0,  // Ready to use
    InUse = 1,      // Currently being used in active cycle(s)
    Depleted = 2,   // All used up
    Partial = 3     // Some used, some available
}

public enum SizeCategory
{
    Small = 0,      // < 0.5 inch
    Medium = 1,     // 0.5 - 1.5 inch
    Large = 2,      // > 1.5 inch
    Mixed = 3,      // Various sizes
    Assorted = 4    // Deliberately mixed sizes
}

public class Inventory : SoftDeletableEntity
{
    public Guid InventoryId { get; set; }
    public Guid UserId { get; set; }
    public required string Name { get; set; }
    public DateOnly AcquiredDate { get; set; }
    public SourceType SourceType { get; set; }
    public string? SourceName { get; set; }
    public string? SourceLocation { get; set; }
    public string? SourceUrl { get; set; }
    public decimal? TotalWeightGrams { get; set; }
    public decimal? RemainingWeightGrams { get; set; }
    public string DisplayUnit { get; set; } = "g";
    public decimal? Cost { get; set; }
    public InventoryCondition Condition { get; set; } = InventoryCondition.Raw;
    public SizeCategory? SizeCategory { get; set; }
    public int? QualityRating { get; set; } // 1-5
    public InventoryStatus Status { get; set; } = InventoryStatus.Available;
    public string? StorageLocation { get; set; }
    public string? Notes { get; set; }
    public bool IsFavorite { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<InventorySpecimen> InventorySpecimens { get; set; } = [];
    public virtual ICollection<InventoryPhoto> InventoryPhotos { get; set; } = [];
}
