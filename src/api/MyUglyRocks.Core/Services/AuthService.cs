using System.Security.Cryptography;
using Mapster;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class AuthService : IAuthService
{
    private readonly DbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly ICacheService _cacheService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;
    private readonly int _refreshTokenExpirationDays;
    private readonly string _baseUrl;

    private const string PasswordResetKeyPrefix = "pwd_reset:";
    private static readonly TimeSpan PasswordResetTokenExpiry = TimeSpan.FromHours(1);

    public AuthService(
        DbContext context,
        ITokenService tokenService,
        IConfiguration configuration,
        ICacheService cacheService,
        IEmailService emailService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
        _cacheService = cacheService;
        _emailService = emailService;
        _logger = logger;
        _refreshTokenExpirationDays = int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7");
        _baseUrl = _configuration["Email:BaseUrl"] ?? "https://myuglyrocks.com";
    }

    private DbSet<User> Users => _context.Set<User>();
    private DbSet<RefreshToken> RefreshTokens => _context.Set<RefreshToken>();

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        // Check if email already exists
        if (await Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken))
        {
            return new AuthResult(false, Error: "Email already registered");
        }

        // Check if username already exists
        if (await Users.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower(), cancellationToken))
        {
            return new AuthResult(false, Error: "Username already taken");
        }

        // Create user
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = request.Email.ToLower(),
            Username = request.Username,
            DisplayName = request.DisplayName ?? request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            EmailVerified = false,
            IsActive = true,
            Role = UserRole.User,
            DateCreated = DateTime.UtcNow,
            DateUpdated = DateTime.UtcNow
        };

        await Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user.UserId, user.Email, user.Username, user.Role == UserRole.Admin);
        var refreshToken = await CreateRefreshTokenAsync(user.UserId, cancellationToken);

        return new AuthResult(
            true,
            accessToken,
            refreshToken.Token,
            DateTime.UtcNow.AddMinutes(15),
            user.Adapt<UserDto>()
        );
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == request.Email.ToLower(),
            cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return new AuthResult(false, Error: "Invalid email or password");
        }

        if (!user.IsActive)
        {
            return new AuthResult(false, Error: "Account is deactivated");
        }

        // Check for account lockout
        if (user.LockoutEndTime.HasValue && user.LockoutEndTime > DateTime.UtcNow)
        {
            return new AuthResult(false, Error: "Account is temporarily locked. Please try again later.");
        }

        // Reset failed login attempts on successful login
        user.FailedLoginAttempts = 0;
        user.DateLastLogin = DateTime.UtcNow;
        user.DateUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user.UserId, user.Email, user.Username, user.Role == UserRole.Admin);
        var refreshToken = await CreateRefreshTokenAsync(user.UserId, cancellationToken);

        return new AuthResult(
            true,
            accessToken,
            refreshToken.Token,
            DateTime.UtcNow.AddMinutes(15),
            user.Adapt<UserDto>()
        );
    }

    public async Task<AuthResult> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var storedToken = await RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken);

        if (storedToken == null)
        {
            return new AuthResult(false, Error: "Invalid refresh token");
        }

        if (storedToken.IsRevoked)
        {
            return new AuthResult(false, Error: "Refresh token has been revoked");
        }

        if (storedToken.DateExpires < DateTime.UtcNow)
        {
            return new AuthResult(false, Error: "Refresh token has expired");
        }

        var user = storedToken.User;
        if (!user.IsActive)
        {
            return new AuthResult(false, Error: "Account is deactivated");
        }

        // Revoke old token
        storedToken.IsRevoked = true;
        storedToken.DateRevoked = DateTime.UtcNow;
        storedToken.DateUpdated = DateTime.UtcNow;

        // Generate new tokens
        var accessToken = _tokenService.GenerateAccessToken(user.UserId, user.Email, user.Username, user.Role == UserRole.Admin);
        var newRefreshToken = await CreateRefreshTokenAsync(user.UserId, cancellationToken);

        storedToken.ReplacedByTokenId = newRefreshToken.RefreshTokenId;
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResult(
            true,
            accessToken,
            newRefreshToken.Token,
            DateTime.UtcNow.AddMinutes(15),
            user.Adapt<UserDto>()
        );
    }

    public async Task<bool> LogoutAsync(Guid userId, string refreshToken, CancellationToken cancellationToken = default)
    {
        var storedToken = await RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.UserId == userId, cancellationToken);

        if (storedToken == null)
        {
            return false;
        }

        storedToken.IsRevoked = true;
        storedToken.DateRevoked = DateTime.UtcNow;
        storedToken.DateUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> VerifyEmailAsync(string token, CancellationToken cancellationToken = default)
    {
        // TODO: Implement with EmailVerificationToken entity
        // For now, this is a placeholder that always returns true
        await Task.CompletedTask;
        return true;
    }

    public async Task<bool> RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == email.ToLower(),
            cancellationToken);

        if (user == null)
        {
            // Return true anyway to prevent email enumeration
            _logger.LogInformation("Password reset requested for non-existent email");
            return true;
        }

        // Generate a secure token
        var token = GenerateSecureToken();
        var cacheKey = $"{PasswordResetKeyPrefix}{token}";

        // Store token -> userId mapping in Redis with expiry
        var tokenData = new PasswordResetTokenData
        {
            UserId = user.UserId,
            Email = user.Email,
            CreatedAt = DateTime.UtcNow
        };

        await _cacheService.SetAsync(cacheKey, tokenData, PasswordResetTokenExpiry, cancellationToken);

        // Build reset URL and send email
        var resetUrl = $"{_baseUrl}/reset-password?token={token}";

        try
        {
            await _emailService.SendPasswordResetEmailAsync(
                user.Email,
                user.DisplayName ?? user.Username,
                resetUrl,
                cancellationToken);

            _logger.LogInformation("Password reset email sent to {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
            // Remove the token from cache since email failed
            await _cacheService.RemoveAsync(cacheKey, cancellationToken);
            throw;
        }

        return true;
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{PasswordResetKeyPrefix}{token}";

        // Atomically retrieve and remove token to prevent replay attacks
        // This ensures the token can only be used once, even with concurrent requests
        var tokenData = await _cacheService.GetAndRemoveAsync<PasswordResetTokenData>(cacheKey, cancellationToken);

        if (tokenData == null)
        {
            _logger.LogWarning("Invalid, expired, or already-used password reset token attempted");
            return false;
        }

        // Get the user
        var user = await Users.FirstOrDefaultAsync(u => u.UserId == tokenData.UserId, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("Password reset token for non-existent user {UserId}", tokenData.UserId);
            // Token already removed by GetAndRemoveAsync
            return false;
        }

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.DatePasswordChanged = DateTime.UtcNow;
        user.DateUpdated = DateTime.UtcNow;
        user.FailedLoginAttempts = 0;
        user.LockoutEndTime = null;

        await _context.SaveChangesAsync(cancellationToken);

        // Token already invalidated by GetAndRemoveAsync at the start

        // Revoke all existing refresh tokens for this user (security measure)
        var activeTokens = await RefreshTokens
            .Where(rt => rt.UserId == user.UserId && !rt.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in activeTokens)
        {
            refreshToken.IsRevoked = true;
            refreshToken.DateRevoked = DateTime.UtcNow;
            refreshToken.DateUpdated = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Password successfully reset for user {UserId}", user.UserId);

        // Send password changed notification email
        try
        {
            await _emailService.SendPasswordChangedEmailAsync(
                user.Email,
                user.DisplayName ?? user.Username,
                DateTime.UtcNow,
                cancellationToken);
        }
        catch (Exception ex)
        {
            // Don't fail the reset if notification email fails
            _logger.LogWarning(ex, "Failed to send password changed notification to {Email}", user.Email);
        }

        return true;
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    private class PasswordResetTokenData
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    private async Task<RefreshToken> CreateRefreshTokenAsync(Guid userId, CancellationToken cancellationToken)
    {
        var refreshToken = new RefreshToken
        {
            RefreshTokenId = Guid.NewGuid(),
            Token = _tokenService.GenerateRefreshToken(),
            UserId = userId,
            DateExpires = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
            IsRevoked = false,
            DateCreated = DateTime.UtcNow,
            DateUpdated = DateTime.UtcNow
        };

        await RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return refreshToken;
    }
}
