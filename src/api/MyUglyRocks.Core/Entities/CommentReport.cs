namespace MyUglyRocks.Core.Entities;

public enum ReportReason
{
    Spam = 0,
    Harassment = 1,
    Inappropriate = 2,
    Other = 3
}

public enum ReportStatus
{
    Pending = 0,
    Reviewed = 1,
    Dismissed = 2,
    ActionTaken = 3
}

public class CommentReport : BaseEntity
{
    public Guid CommentReportId { get; set; }
    public Guid CommentId { get; set; }
    public Guid ReportedByUserId { get; set; }
    public ReportReason Reason { get; set; }
    public string? Details { get; set; }
    public ReportStatus Status { get; set; } = ReportStatus.Pending;
    public Guid? ResolvedByUserId { get; set; }
    public DateTime? ResolvedDate { get; set; }
    public string? ResolutionNotes { get; set; }

    // Navigation properties
    public virtual Comment Comment { get; set; } = null!;
    public virtual User ReportedByUser { get; set; } = null!;
    public virtual User? ResolvedByUser { get; set; }
}
