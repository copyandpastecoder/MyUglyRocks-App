using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

public record PostDto
{
    public Guid PostId { get; init; }
    public Guid UserId { get; init; }
    public Guid? CycleId { get; init; }
    public Guid? InventoryId { get; init; }
    public required string PostType { get; init; } // "Cycle", "Inventory", or "Feedback"
    public string? FeedbackCategory { get; init; } // Only set for Feedback posts
    public required string Title { get; init; }
    public string? Description { get; init; }
    public string Status { get; init; } = "Published";
    public DateTime PublishedDate { get; init; }
    public int VoteCount { get; init; }
    public int CommentCount { get; init; }
    public PostAuthorDto Author { get; init; } = null!;
    public CyclePreviewDto? Cycle { get; init; }
    public InventoryPreviewDto? Inventory { get; init; }
    public IEnumerable<PostPhotoDto> Photos { get; init; } = [];
}

public record PostListDto
{
    public Guid PostId { get; init; }
    public required string PostType { get; init; } // "Cycle", "Inventory", or "Feedback"
    public string? FeedbackCategory { get; init; } // Only set for Feedback posts
    public required string Title { get; init; }
    public string? Description { get; init; }
    public DateTime PublishedDate { get; init; }
    public int VoteCount { get; init; }
    public int CommentCount { get; init; }
    public PostAuthorDto Author { get; init; } = null!;
    public string? CoverPhotoUrl { get; init; }
    public string? CoverPhotoThumbnailUrl { get; init; }
    public string? CoverPhotoBlurHash { get; init; }
    public int PhotoCount { get; init; }
    // Inventory-specific fields for gallery card display
    public string? SourceType { get; init; }
    public IEnumerable<string> SpecimenNames { get; init; } = [];
    public IEnumerable<string> SizeCategories { get; init; } = [];
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
    public Guid PostId { get; init; }
    public Guid PhotoId { get; init; }
    public required string Url { get; init; }
    public int SortOrder { get; init; }
    public bool IsCover { get; init; }
    public string? ThumbnailUrl { get; init; }
    public string? MediumUrl { get; init; }
    public string? LargeUrl { get; init; }
    public string? BlurHash { get; init; }
    public int? Width { get; init; }
    public int? Height { get; init; }
}

public record CyclePreviewDto
{
    public Guid CycleId { get; init; }
    public required string Name { get; init; }
    public string Status { get; init; } = "Completed";
    public DateOnly StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public int? DifficultyRating { get; init; }
    public int? FinalQuality { get; init; }
    public int StageCount { get; init; }
    // Extended fields for gallery display
    public int ElapsedDays { get; init; }
    public int TotalRuntimeHours { get; init; }
    public int PhotoCount { get; init; }
    public string? TumblerName { get; init; }
    public string? BarrelName { get; init; }
    public IEnumerable<string> SpecimenNames { get; init; } = [];
}

public record InventoryPreviewDto
{
    public Guid InventoryId { get; init; }
    public required string Name { get; init; }
    public required string SourceType { get; init; }
    public string? SourceName { get; init; }
    public string? SourceLocation { get; init; }
    public DateOnly AcquiredDate { get; init; }
    public IEnumerable<string> SpecimenNames { get; init; } = [];
    public IEnumerable<string> SizeCategories { get; init; } = [];
    public int PhotoCount { get; init; }
}

public record CreatePostRequest
{
    // For Cycle/Inventory posts: Either CycleId or InventoryId must be provided
    // For Feedback posts: Both should be null
    public Guid? CycleId { get; init; }
    public Guid? InventoryId { get; init; }

    // For Feedback posts: Category is required
    // For Cycle/Inventory posts: Category should be null
    public string? FeedbackCategory { get; init; }

    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Title must be between 1 and 200 characters")]
    public required string Title { get; init; }

    [StringLength(2000, ErrorMessage = "Description must be at most 2000 characters")]
    public string? Description { get; init; }

    public List<Guid> PhotoIds { get; init; } = [];
    public Guid? CoverPhotoId { get; init; }
}

public record UpdatePostRequest
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Title must be between 1 and 200 characters")]
    public required string Title { get; init; }

    [StringLength(2000, ErrorMessage = "Description must be at most 2000 characters")]
    public string? Description { get; init; }

    public List<string>? PhotoIds { get; init; }
}
