namespace MyUglyRocks.Abstractions.DTOs;

// Comment Report DTOs
public record CommentReportDto(
    Guid CommentReportId,
    Guid CommentId,
    string CommentContent,
    string CommentAuthorUsername,
    Guid PostId,
    string PostTitle,
    string ReportedByUsername,
    string Reason,
    string? Details,
    string Status,
    string? ResolvedByUsername,
    DateTime? ResolvedDate,
    string? ResolutionNotes,
    DateTime DateCreated
);

public record CommentReportListDto(
    Guid CommentReportId,
    string CommentExcerpt,
    string CommentAuthorUsername,
    string ReportedByUsername,
    string Reason,
    string Status,
    DateTime DateCreated
);

public record ResolveReportRequest(
    string Status, // Reviewed, Dismissed, ActionTaken
    string? ResolutionNotes,
    bool DeleteComment = false
);

// User Management DTOs
public record AdminUserDto(
    Guid UserId,
    string Username,
    string Email,
    string? DisplayName,
    string Role,
    bool IsActive,
    bool EmailVerified,
    DateTime DateCreated,
    DateTime? DateLastLogin,
    int TotalCycles,
    int TotalPosts,
    int TotalComments
);

public record AdminUserListDto(
    Guid UserId,
    string Username,
    string Email,
    string? DisplayName,
    string Role,
    bool IsActive,
    DateTime DateCreated,
    DateTime? DateLastLogin
);

public record ChangeUserRoleRequest(
    string Role // User, Moderator, Admin
);

public record BanUserRequest(
    string? Reason,
    bool DeleteContent = false
);

/// <summary>
/// Request to create a new user (admin only).
/// The user will need to use "Forgot Password" to set their password.
/// </summary>
public record CreateUserRequest(
    string Email
);

// Admin Statistics DTOs
public record AdminStatsDto(
    int TotalUsers,
    int ActiveUsers,
    int TotalCycles,
    int TotalPosts,
    int TotalComments,
    int PendingReports,
    int UsersRegisteredToday,
    int PostsCreatedToday
);

// Paginated response
public record PaginatedResult<T>(
    IList<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);
