namespace MyUglyRocks.Core.Entities;

public class Barrel : BaseEntity
{
    // Foreign key
    public Guid TumblerId { get; set; }

    // Basic info
    public int BarrelNumber { get; set; }
    public string? Nickname { get; set; }

    // Capacity (immutable after creation - delete and recreate to change)
    public decimal? CapacityLbs { get; set; } // Must be ≤ tumbler's motor capacity

    // Defaults
    public decimal? DefaultGritAmountGrams { get; set; }

    // Dedication
    public bool IsDedicated { get; set; }
    public string[]? DedicatedStages { get; set; }

    // Maintenance
    public DateOnly? DateLastDeepClean { get; set; }
    public string? ContaminationNotes { get; set; }

    // Metadata
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Tumbler Tumbler { get; set; } = null!;
    public virtual ICollection<StageRunBarrel> StageRunBarrels { get; set; } = [];
}
