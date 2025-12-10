namespace MyUglyRocks.Core.Entities;

public class Comment : SoftDeletableEntity
{
    public Guid CommentId { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public Guid? ParentCommentId { get; set; }
    public required string Content { get; set; }
    public bool IsEdited { get; set; }
    public DateTime? EditedDate { get; set; }

    // Navigation properties
    public virtual Post Post { get; set; } = null!;
    public virtual User User { get; set; } = null!;
    public virtual Comment? ParentComment { get; set; }
    public virtual ICollection<Comment> Replies { get; set; } = [];
    public virtual ICollection<CommentReport> Reports { get; set; } = [];
}
