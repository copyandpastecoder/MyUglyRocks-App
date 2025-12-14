namespace MyUglyRocks.Core.Entities;

public enum PostStatus
{
    Published = 0,
    Hidden = 1,
    Removed = 2
}

public class Post : SoftDeletableEntity
{
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }

    // Either CycleId or InventoryId must be set (XOR constraint in DB)
    public Guid? CycleId { get; set; }
    public Guid? InventoryId { get; set; }

    public required string Title { get; set; }
    public string? Description { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Published;
    public DateTime PublishedDate { get; set; }
    public int VoteCount { get; set; }
    public int CommentCount { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Cycle? Cycle { get; set; }
    public virtual Inventory? Inventory { get; set; }
    public virtual ICollection<PostPhoto> PostPhotos { get; set; } = [];
    public virtual ICollection<Vote> Votes { get; set; } = [];
    public virtual ICollection<Comment> Comments { get; set; } = [];
}
