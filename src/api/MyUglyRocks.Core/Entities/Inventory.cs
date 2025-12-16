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
    ZeroToOne = 0,      // 0 - 1"
    OneToTwo = 1,       // 1" - 2"
    TwoToThree = 2,     // 2" - 3"
    ThreeToFour = 3,    // 3" - 4"
    FourToFive = 4,     // 4" - 5"
    GreaterThanFive = 5,// Greater than 5"
    Assorted = 6        // Assorted
}

public class Inventory : SoftDeletableEntity
{
    public Guid InventoryId { get; set; }
    public Guid UserId { get; set; }
    public Guid? InventorySourceId { get; set; }
    public required string Name { get; set; }
    public DateOnly AcquiredDate { get; set; }
    public decimal? TotalWeightGrams { get; set; }
    public decimal? RemainingWeightGrams { get; set; }
    public string DisplayUnit { get; set; } = "g";
    public decimal? Cost { get; set; }
    public string? SizeCategories { get; set; }  // Comma-separated list of SizeCategory values (aggregated from specimens)
    public int? QualityRating { get; set; } // 1-5
    public string? StorageLocation { get; set; }
    public string? Notes { get; set; }

    // Legacy fields - kept for migration, will be removed after migration
    [Obsolete("Use InventorySource.SourceType instead. Kept for migration.")]
    public SourceType SourceType { get; set; }
    [Obsolete("Use InventorySource.Name instead. Kept for migration.")]
    public string? SourceName { get; set; }
    [Obsolete("Use InventorySource.Location instead. Kept for migration.")]
    public string? SourceLocation { get; set; }
    [Obsolete("Use InventorySource.Url instead. Kept for migration.")]
    public string? SourceUrl { get; set; }
    [Obsolete("Status moved to InventorySpecimen. Kept for migration.")]
    public InventoryStatus Status { get; set; } = InventoryStatus.Available;
    [Obsolete("IsFavorite feature removed. Kept for migration.")]
    public bool IsFavorite { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual InventorySource? InventorySource { get; set; }
    public virtual ICollection<InventorySpecimen> InventorySpecimens { get; set; } = [];
    public virtual ICollection<InventoryPhoto> InventoryPhotos { get; set; } = [];
}
