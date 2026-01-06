using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

// Admin request/response DTOs
public record CreateInvitationCodeRequest(
    [Range(1, 1000, ErrorMessage = "Quantity must be between 1 and 1000")]
    int Quantity = 1,

    [StringLength(500, ErrorMessage = "Description must be at most 500 characters")]
    string? Description = null,

    [DataType(DataType.DateTime, ErrorMessage = "Invalid date format")]
    DateTime? ExpiresAt = null
);

public record InvitationCodeDto(
    Guid InvitationCodeId,
    string Code,
    DateTime DateCreated,
    DateTime? DateUsed,
    Guid? UsedByUserId,
    string? UsedByUsername,
    DateTime? DateExpires,
    bool IsRevoked,
    DateTime? DateRevoked,
    string? Description,
    string Status // "Unused", "Used", "Expired", "Revoked"
);

public record PaginatedInvitationCodesResponse(
    List<InvitationCodeDto> Codes,
    int Total,
    int Page,
    int PageSize
);

public record RevokeInvitationCodeRequest(
    [Required(ErrorMessage = "Reason is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Reason must be between 1 and 255 characters")]
    string Reason
);

// Registration flow DTOs
public record RegisterWithInvitationCodeRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(254, ErrorMessage = "Email must be at most 254 characters")]
    string Email,

    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_-]+$", ErrorMessage = "Username can only contain letters, numbers, underscores, and hyphens")]
    string Username,

    [Required(ErrorMessage = "Password is required")]
    [StringLength(128, MinimumLength = 12, ErrorMessage = "Password must be between 12 and 128 characters")]
    string Password,

    [StringLength(100, ErrorMessage = "Display name must be at most 100 characters")]
    string? DisplayName = null,

    [Required(ErrorMessage = "Invitation code is required")]
    [StringLength(50, ErrorMessage = "Invalid invitation code format")]
    string InvitationCode = ""
);

public record ValidateInvitationCodeRequest(
    [Required(ErrorMessage = "Invitation code is required")]
    [StringLength(50, ErrorMessage = "Invalid invitation code format")]
    string Code
);

public record InvitationCodeValidationResult(
    bool IsValid,
    string? Error = null,
    Guid? InvitationCodeId = null
);

public record InvitationStatsDto(
    int TotalCodesGenerated,
    int CodesUsed,
    int CodesExpired,
    int CodesRevoked,
    int CodesAvailable
);
