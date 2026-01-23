namespace MyUglyRocks.Core.Entities;

public enum CycleStatus
{
    Active = 0,
    Completed = 1
}

public class Cycle : SoftDeletableEntity
{
    public Guid CycleId { get; set; }
    public Guid UserId { get; set; }
    public required string Name { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public CycleStatus Status { get; set; } = CycleStatus.Active;
    public int? DifficultyRating { get; set; } // 1-5
    public int? FinalQuality { get; set; } // 1-5
    public string? AdditionalSpecimens { get; set; }
    public string? Notes { get; set; }

    // Merge tracking
    /// <summary>
    /// JSON array of cycle IDs that were merged to create this cycle.
    /// Only set if this cycle was created by merging other cycles.
    /// </summary>
    public string? MergedFromCycleIds { get; set; }

    /// <summary>
    /// The cycle ID this cycle was merged into.
    /// Only set if this cycle was merged into another cycle.
    /// </summary>
    public Guid? MergedIntoCycleId { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<StageRun> StageRuns { get; set; } = [];
    public virtual ICollection<CycleSpecimen> CycleSpecimens { get; set; } = [];

    /// <summary>
    /// Navigation property for the cycle this was merged into
    /// </summary>
    public virtual Cycle? MergedIntoCycle { get; set; }
}
