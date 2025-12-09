namespace MyUglyRocks.Core.Entities;

/// <summary>
/// Stores email addresses of users who want to be notified when the app launches
/// </summary>
public class WaitlistEntry : BaseEntity
{
    public required string Email { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool NotificationSent { get; set; }
    public DateTime? DateNotificationSent { get; set; }
}
