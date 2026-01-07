using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

public record RegisterRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(254, ErrorMessage = "Email must be at most 254 characters")]
    string Email,

    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Username can only contain letters, numbers, and underscores")]
    string Username,

    [Required(ErrorMessage = "Password is required")]
    [StringLength(128, MinimumLength = 12, ErrorMessage = "Password must be between 12 and 128 characters")]
    string Password,

    [StringLength(100, ErrorMessage = "Display name must be at most 100 characters")]
    string? DisplayName = null
);

public record LoginRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email,

    [Required(ErrorMessage = "Password is required")]
    string Password,

    // Optional analytics fields (sent from frontend)
    [Range(0, 10000, ErrorMessage = "Invalid screen width")]
    int? ScreenWidth = null,

    [Range(0, 10000, ErrorMessage = "Invalid screen height")]
    int? ScreenHeight = null,

    bool? SupportsWebP = null,
    bool? SupportsAvif = null,

    [StringLength(64, ErrorMessage = "Timezone must be at most 64 characters")]
    string? Timezone = null,

    [StringLength(16, ErrorMessage = "Language must be at most 16 characters")]
    string? Language = null,

    [StringLength(128, ErrorMessage = "Referrer domain must be at most 128 characters")]
    string? ReferrerDomain = null
);

public record AuthResult(
    bool Success,
    string? AccessToken = null,
    string? RefreshToken = null,
    DateTime? DateExpires = null,
    UserDto? User = null,
    string? Error = null,
    Guid? SessionId = null
);

public record UserDto(
    Guid UserId,
    string Email,
    string Username,
    string? DisplayName,
    string? AvatarUrl,
    bool EmailVerified,
    string Role,
    DateTime DateCreated
);

public record RefreshTokenRequest(
    [Required(ErrorMessage = "Refresh token is required")]
    string RefreshToken
);

public record ForgotPasswordRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email
);

public record ResetPasswordRequest(
    [Required(ErrorMessage = "Token is required")]
    string Token,

    [Required(ErrorMessage = "New password is required")]
    [StringLength(128, MinimumLength = 12, ErrorMessage = "Password must be between 12 and 128 characters")]
    string NewPassword
);

public record VerifyEmailRequest(
    [Required(ErrorMessage = "Token is required")]
    string Token
);
