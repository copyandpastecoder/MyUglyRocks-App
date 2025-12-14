using System.ComponentModel.DataAnnotations;

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
    [Required(ErrorMessage = "Content is required")]
    [StringLength(5000, MinimumLength = 1, ErrorMessage = "Content must be between 1 and 5000 characters")]
    public required string Content { get; init; }

    public Guid? ParentCommentId { get; init; }
}

public record UpdateCommentRequest
{
    [Required(ErrorMessage = "Content is required")]
    [StringLength(5000, MinimumLength = 1, ErrorMessage = "Content must be between 1 and 5000 characters")]
    public required string Content { get; init; }
}

public record ReportCommentRequest
{
    [Required(ErrorMessage = "Reason is required")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Reason must be between 1 and 200 characters")]
    public required string Reason { get; init; }

    [StringLength(1000, ErrorMessage = "Details must be at most 1000 characters")]
    public string? Details { get; init; }
}
