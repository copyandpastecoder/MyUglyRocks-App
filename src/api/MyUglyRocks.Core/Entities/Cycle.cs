namespace MyUglyRocks.Core.Entities;

public enum CycleStatus
{
    Active = 0,
    Completed = 1,
    Archived = 2
}

public class Cycle : SoftDeletableEntity
{
    public Guid UserId { get; set; }
    public required string Name { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public CycleStatus Status { get; set; } = CycleStatus.Active;
    public string? Goal { get; set; }
    public int? DifficultyRating { get; set; } // 1-5
    public int? FinalQuality { get; set; } // 1-5
    public string? AdditionalSpecimens { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<StageRun> StageRuns { get; set; } = [];
    public virtual ICollection<CycleSpecimen> CycleSpecimens { get; set; } = [];
}
