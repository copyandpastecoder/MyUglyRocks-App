namespace MyUglyRocks.Core.Entities;

public enum StageRunStatus
{
    Planned = 0,   // Stage configured but not started
    Active = 1,    // Stage currently running
    Completed = 2  // Stage finished
}

public enum StageNextAction
{
    Advance = 0,
    Repeat = 1,
    Abort = 2,
    Complete = 3
}

public class StageRun : SoftDeletableEntity
{
    public Guid StageRunId { get; set; }

    // Foreign keys
    public Guid CycleId { get; set; }

    // Basic info
    public required string StageName { get; set; }
    public int RunNumber { get; set; } = 1; // Which run of this stage (1st, 2nd, etc.)
    public StageRunStatus Status { get; set; } = StageRunStatus.Active;

    // Timing
    public DateTime StartDateTime { get; set; }
    public int DurationDays { get; set; }
    public int DurationHours { get; set; }
    public DateTime? EndDateTime { get; set; }  // Actual end date - only set on completion/abort
    public DateTime? DurationEstimateEndDate { get; set; }  // Calculated estimate based on StartDateTime + Duration

    // Reminder settings
    public bool ReminderEnabled { get; set; }
    public int? RemindAfterDays { get; set; }
    public bool? RemindAtEndOfStage { get; set; }
    public DateTime? DateReminderSent { get; set; }

    // Load & barrel setup
    public decimal? LoadWeightBeforeGrams { get; set; }
    public decimal? LoadWeightAfterGrams { get; set; }
    public int? WaterAmountMl { get; set; } // Precise measurement in milliliters

    // Results
    public int? ResultRating { get; set; } // 1-5 overall rating
    public int? ResultShapeRounding { get; set; } // 0-100
    public int? ResultScratchLevel { get; set; } // 0-100
    public int? ResultPitting { get; set; } // 0-100
    public int? ResultShine { get; set; } // 0-100

    // Issues observed
    public bool? IssueScratches { get; set; }
    public bool? IssueChips { get; set; }
    public bool? IssueUnderRounded { get; set; }
    public bool? IssueContamination { get; set; }

    // Notes & next steps
    public string? LessonsLearned { get; set; }
    public StageNextAction? NextAction { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Cycle Cycle { get; set; } = null!;
    public virtual ICollection<StageRunBarrel> StageRunBarrels { get; set; } = [];
    public virtual CleaningRun? CleaningRun { get; set; }
    public virtual ICollection<StageMaterial> StageMaterials { get; set; } = [];
    public virtual ICollection<Photo> Photos { get; set; } = [];
}
