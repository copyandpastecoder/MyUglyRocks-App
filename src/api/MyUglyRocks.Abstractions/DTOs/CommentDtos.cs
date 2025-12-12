namespace MyUglyRocks.Abstractions.DTOs;

public record CommentDto
{
    public Guid CommentId { get; init; }
    public Guid PostId { get; init; }
    public Guid? ParentCommentId { get; init; }
    public required string Content { get; init; }
    public bool IsEdited { get; init; }
    public DateTime? EditedDate { get; init; }
    public DateTime DateCreated { get; init; }
    public CommentAuthorDto Author { get; init; } = null!;
    public IEnumerable<CommentDto> Replies { get; init; } = [];
}

public record CommentAuthorDto
{
    public Guid UserId { get; init; }
    public required string Username { get; init; }
    public string? DisplayName { get; init; }
    public string? AvatarUrl { get; init; }
}

public record CreateCommentRequest
{
    public required string Content { get; init; }
    public Guid? ParentCommentId { get; init; }
}

public record UpdateCommentRequest
{
    public required string Content { get; init; }
}

public record ReportCommentRequest
{
    public required string Reason { get; init; }
    public string? Details { get; init; }
}
