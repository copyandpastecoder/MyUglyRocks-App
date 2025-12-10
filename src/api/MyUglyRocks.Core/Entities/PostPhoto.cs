namespace MyUglyRocks.Core.Entities;

/// <summary>
/// Association table for Post-Photo many-to-many relationship.
/// Uses composite primary key (PostId + PhotoId).
/// </summary>
public class PostPhoto
{
    public Guid PostId { get; set; }
    public Guid PhotoId { get; set; }
    public int SortOrder { get; set; }
    public bool IsCover { get; set; }
    public DateTime DateCreated { get; set; }
    public DateTime DateUpdated { get; set; }

    // Navigation properties
    public virtual Post Post { get; set; } = null!;
    public virtual Photo Photo { get; set; } = null!;
}
