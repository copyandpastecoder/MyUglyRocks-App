namespace MyUglyRocks.Core.Entities;

public enum PostStatus
{
    Published = 0,
    Hidden = 1,
    Removed = 2
}

public enum PostType
{
    Cycle = 0,
    Inventory = 1,
    Feedback = 2
}

public enum FeedbackCategory
{
    General = 0,
    Cycles = 1,
    Inventory = 2,
    Tumblers = 3,
    Gallery = 4,
    Materials = 5,
    Specimens = 6,
    FAQ = 7,
    Settings = 8
}

public class Post : SoftDeletableEntity
{
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }

    // PostType determines whether this is a Cycle post, Inventory post, or Feedback post
    public PostType PostType { get; set; } = PostType.Cycle;

    // For Cycle and Inventory posts: Either CycleId or InventoryId must be set
    // For Feedback posts: Both should be null
    public Guid? CycleId { get; set; }
    public Guid? InventoryId { get; set; }

    // For Feedback posts: Category is required
    // For Cycle/Inventory posts: Category is null
    public FeedbackCategory? FeedbackCategory { get; set; }

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
