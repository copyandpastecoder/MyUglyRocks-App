namespace MyUglyRocks.Core.Entities;

public enum CleaningRunStatus
{
    Active = 0,
    Completed = 1
}

public enum CleaningPurpose
{
    PostStageClean = 0,
    PrePolishClean = 1,
    FinalBurnish = 2,
    GritRemoval = 3
}

public class CleaningRun : BaseEntity
{
    public Guid CleaningRunId { get; set; }
    public Guid StageRunId { get; set; }
    public int DurationMinutes { get; set; }
    public CleaningPurpose? Purpose { get; set; }
    public CleaningRunStatus Status { get; set; } = CleaningRunStatus.Active;
    public bool ReminderEnabled { get; set; }
    public DateTime? DateReminderSent { get; set; }
    public string? ResultNotes { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual StageRun StageRun { get; set; } = null!;
    public virtual ICollection<CleaningMaterial> CleaningMaterials { get; set; } = [];
}
