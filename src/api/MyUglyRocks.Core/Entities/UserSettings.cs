namespace MyUglyRocks.Core.Entities;

public enum MeasurementSystem { Imperial = 0, Metric = 1 }
public enum DateFormat { MMDDYYYY = 0, DDMMYYYY = 1, YYYYMMDD = 2 }
public enum TimeFormat { TwelveHour = 0, TwentyFourHour = 1 }
public enum FirstDayOfWeek { Sunday = 0, Monday = 1 }
public enum TrackingMode { Easy = 0, Advanced = 1 }
public enum FontSize { Small = 0, Normal = 1, Large = 2 }
public enum Density { Compact = 0, Comfortable = 1 }
public enum DefaultHomeSection { ActiveCycles = 0, Dashboard = 1, Gallery = 2 }
public enum DigestFrequency { Instant = 0, Daily = 1 }
public enum PhotoUploadQuality { DataSaver = 0, Balanced = 1, HighQuality = 2 }
public enum PostVisibility { Private = 0, Unlisted = 1, Public = 2 }

public class UserSettings : BaseEntity
{
    public Guid UserId { get; set; }
    public MeasurementSystem MeasurementSystem { get; set; } = MeasurementSystem.Imperial;
    public DateFormat DateFormat { get; set; } = DateFormat.MMDDYYYY;
    public TimeFormat TimeFormat { get; set; } = TimeFormat.TwelveHour;
    public string Timezone { get; set; } = "UTC";
    public FirstDayOfWeek FirstDayOfWeek { get; set; } = FirstDayOfWeek.Sunday;
    public bool ShowRelativeTimes { get; set; } = true;
    public TrackingMode TrackingMode { get; set; } = TrackingMode.Easy;
    public FontSize FontSize { get; set; } = FontSize.Normal;
    public Density Density { get; set; } = Density.Comfortable;
    public DefaultHomeSection DefaultHomeSection { get; set; } = DefaultHomeSection.ActiveCycles;
    public bool NotifyStageReminders { get; set; } = true;
    public bool NotifyComments { get; set; } = true;
    public bool NotifyReplies { get; set; } = true;
    public bool NotifyUglyRocks { get; set; } = true;
    public bool NotifyRecipeCloned { get; set; } = true;
    public bool QuietHoursEnabled { get; set; }
    public TimeOnly? QuietHoursStart { get; set; }
    public TimeOnly? QuietHoursEnd { get; set; }
    public DigestFrequency DigestFrequency { get; set; } = DigestFrequency.Instant;
    public PhotoUploadQuality PhotoUploadQuality { get; set; } = PhotoUploadQuality.Balanced;
    public bool AddWatermark { get; set; }
    public bool AutoFillFromLastRun { get; set; } = true;
    public PostVisibility DefaultPostVisibility { get; set; } = PostVisibility.Private;
    public string Theme { get; set; } = "obsidian";
    public string? StageFieldVisibility { get; set; } // JSON

    // Navigation property
    public virtual User User { get; set; } = null!;
}
