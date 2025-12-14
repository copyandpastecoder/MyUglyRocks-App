namespace MyUglyRocks.Core.Entities;

public class Vote : BaseEntity
{
    public Guid VoteId { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }

    // Navigation properties
    public virtual Post Post { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
