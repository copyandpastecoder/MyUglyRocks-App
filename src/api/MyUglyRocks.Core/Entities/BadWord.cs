namespace MyUglyRocks.Core.Entities;

/// <summary>
/// Represents a word or phrase that is not allowed in usernames.
/// </summary>
public class BadWord : BaseEntity
{
    public int BadWordId { get; set; }

    /// <summary>
    /// The banned word or phrase (stored in lowercase for case-insensitive matching).
    /// </summary>
    public required string Word { get; set; }

    /// <summary>
    /// Optional notes about why this word is banned or source of the ban.
    /// </summary>
    public string? Notes { get; set; }
}
