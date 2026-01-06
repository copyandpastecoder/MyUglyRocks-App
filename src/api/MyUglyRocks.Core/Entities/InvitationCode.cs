namespace MyUglyRocks.Core.Entities;

/// <summary>
/// Represents an invitation code that can be used for user registration.
/// Each code can only be used once and optionally expires after a specified date.
/// </summary>
public class InvitationCode : BaseEntity
{
    public Guid InvitationCodeId { get; set; }

    /// <summary>
    /// The actual invitation code (e.g., "ROCK-ABC1-XYZ2")
    /// Must be unique in the database.
    /// </summary>
    public required string Code { get; set; }

    /// <summary>
    /// Admin user who generated this invitation code
    /// </summary>
    public Guid CreatedByUserId { get; set; }

    /// <summary>
    /// User who used this code to register (null if not yet used)
    /// </summary>
    public Guid? UsedByUserId { get; set; }

    /// <summary>
    /// Date and time when the code was used (null if not yet used)
    /// </summary>
    public DateTime? DateUsed { get; set; }

    /// <summary>
    /// Optional expiration date. If set, code cannot be used after this date.
    /// </summary>
    public DateTime? DateExpires { get; set; }

    /// <summary>
    /// Flag indicating if the code is revoked by admin (prevents use even if not expired)
    /// </summary>
    public bool IsRevoked { get; set; } = false;

    /// <summary>
    /// Date when code was revoked by admin (null if not revoked)
    /// </summary>
    public DateTime? DateRevoked { get; set; }

    /// <summary>
    /// Admin user who revoked this code (null if not revoked)
    /// </summary>
    public Guid? RevokedByUserId { get; set; }

    /// <summary>
    /// Optional description for admin reference (e.g., "For event on 2025-01-15")
    /// </summary>
    public string? Description { get; set; }

    // Navigation properties
    public virtual User CreatedByUser { get; set; } = null!;
    public virtual User? UsedByUser { get; set; }
    public virtual User? RevokedByUser { get; set; }
}
