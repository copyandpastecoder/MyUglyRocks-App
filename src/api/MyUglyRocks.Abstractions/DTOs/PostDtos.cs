namespace MyUglyRocks.Abstractions.DTOs;

public record PostDto
{
    public Guid PostId { get; init; }
    public Guid UserId { get; init; }
    public Guid CycleId { get; init; }
    public required string Title { get; init; }
    public string? Description { get; init; }
    public string Status { get; init; } = "Published";
    public DateTime PublishedDate { get; init; }
    public int VoteCount { get; init; }
    public int CommentCount { get; init; }
    public PostAuthorDto Author { get; init; } = null!;
    public CyclePreviewDto Cycle { get; init; } = null!;
    public IEnumerable<PostPhotoDto> Photos { get; init; } = [];
}

public record PostListDto
{
    public Guid PostId { get; init; }
    public required string Title { get; init; }
    public string? Description { get; init; }
    public DateTime PublishedDate { get; init; }
    public int VoteCount { get; init; }
    public int CommentCount { get; init; }
    public PostAuthorDto Author { get; init; } = null!;
    public string? CoverPhotoUrl { get; init; }
    public int PhotoCount { get; init; }
}

public record PostAuthorDto
{
    public Guid UserId { get; init; }
    public required string Username { get; init; }
    public string? DisplayName { get; init; }
    public string? AvatarUrl { get; init; }
}

public record PostPhotoDto
{
    public Guid PostPhotoId { get; init; }
    public Guid PhotoId { get; init; }
    public required string Url { get; init; }
    public int SortOrder { get; init; }
    public bool IsCover { get; init; }
}

public record CyclePreviewDto
{
    public Guid CycleId { get; init; }
    public required string Name { get; init; }
    public string Status { get; init; } = "Completed";
    public DateOnly StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public string? Goal { get; init; }
    public int? DifficultyRating { get; init; }
    public int? FinalQuality { get; init; }
    public int StageCount { get; init; }
}

public record CreatePostRequest
{
    public required Guid CycleId { get; init; }
    public required string Title { get; init; }
    public string? Description { get; init; }
    public List<Guid> PhotoIds { get; init; } = [];
    public Guid? CoverPhotoId { get; init; }
}

public record UpdatePostRequest
{
    public required string Title { get; init; }
    public string? Description { get; init; }
}
