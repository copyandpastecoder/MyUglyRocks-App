namespace MyUglyRocks.Abstractions.DTOs;

public record RegisterRequest(
    string Email,
    string Username,
    string Password,
    string? DisplayName = null
);

public record LoginRequest(
    string Email,
    string Password
);

public record AuthResult(
    bool Success,
    string? AccessToken = null,
    string? RefreshToken = null,
    DateTime? DateExpires = null,
    UserDto? User = null,
    string? Error = null
);

public record UserDto(
    Guid Id,
    string Email,
    string Username,
    string? DisplayName,
    string? AvatarUrl,
    bool EmailVerified,
    string Role,
    DateTime DateCreated
);

public record RefreshTokenRequest(
    string RefreshToken
);

public record ForgotPasswordRequest(
    string Email
);

public record ResetPasswordRequest(
    string Token,
    string NewPassword
);

public record VerifyEmailRequest(
    string Token
);
