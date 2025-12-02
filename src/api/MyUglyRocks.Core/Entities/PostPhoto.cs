namespace MyUglyRocks.Core.Entities;

public class PostPhoto : BaseEntity
{
    public Guid PostId { get; set; }
    public Guid PhotoId { get; set; }
    public int SortOrder { get; set; }
    public bool IsCover { get; set; }

    // Navigation properties
    public virtual Post Post { get; set; } = null!;
    public virtual Photo Photo { get; set; } = null!;
}
