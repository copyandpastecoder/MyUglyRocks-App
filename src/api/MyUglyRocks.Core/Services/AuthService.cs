using System.Security.Cryptography;
using Mapster;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;
using MyUglyRocks.Core.Validation;

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

    private const string EmailVerificationKeyPrefix = "email_verify:";
    private static readonly TimeSpan EmailVerificationTokenExpiry = TimeSpan.FromHours(24);

    // Account lockout settings
    private const int MaxFailedLoginAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

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
        // Validate password strength
        var passwordValidation = ValidationHelper.ValidatePassword(request.Password);
        if (!passwordValidation.IsValid)
        {
            return new AuthResult(false, Error: string.Join("; ", passwordValidation.Errors));
        }

        // Validate username length
        var usernameErrors = ValidationHelper.ValidateStringLength(
            request.Username,
            "Username",
            ValidationHelper.StringLimits.UsernameMin,
            ValidationHelper.StringLimits.UsernameMax,
            required: true);
        if (usernameErrors.Count > 0)
        {
            return new AuthResult(false, Error: string.Join("; ", usernameErrors));
        }

        // Validate email
        if (!ValidationHelper.IsValidEmail(request.Email))
        {
            return new AuthResult(false, Error: "Invalid email format");
        }

        var emailErrors = ValidationHelper.ValidateStringLength(
            request.Email,
            "Email",
            maxLength: ValidationHelper.StringLimits.EmailMax,
            required: true);
        if (emailErrors.Count > 0)
        {
            return new AuthResult(false, Error: string.Join("; ", emailErrors));
        }

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
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            EmailVerified = false,
            IsActive = true,
            Role = UserRole.User,
            DateCreated = DateTime.UtcNow,
            DateUpdated = DateTime.UtcNow
        };

        await Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Generate email verification token
        var verificationToken = GenerateSecureToken();
        var cacheKey = $"{EmailVerificationKeyPrefix}{verificationToken}";

        // Store token -> userId mapping in Redis with expiry
        var tokenData = new EmailVerificationTokenData
        {
            UserId = user.UserId,
            Email = user.Email,
            CreatedAt = DateTime.UtcNow
        };

        await _cacheService.SetAsync(cacheKey, tokenData, EmailVerificationTokenExpiry, cancellationToken);

        // Build verification URL and send email
        var verificationUrl = $"{_baseUrl}/verify-email?token={verificationToken}";

        try
        {
            await _emailService.SendVerificationEmailAsync(
                user.Email,
                user.Username,
                verificationUrl,
                cancellationToken);

            _logger.LogInformation("Verification email sent to {Email}", PiiMaskingHelper.MaskEmail(user.Email));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", PiiMaskingHelper.MaskEmail(user.Email));
            // Remove the token from cache since email failed
            await _cacheService.RemoveAsync(cacheKey, cancellationToken);
            throw;
        }

        // Return success without tokens - user must verify email first
        return new AuthResult(true, Error: null);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == request.Email.ToLower(),
            cancellationToken);

        // User not found - return generic error to prevent email enumeration
        if (user == null)
        {
            return new AuthResult(false, Error: "Invalid email or password");
        }

        // Check for account lockout first
        if (user.LockoutEndTime.HasValue && user.LockoutEndTime > DateTime.UtcNow)
        {
            var remainingMinutes = (int)Math.Ceiling((user.LockoutEndTime.Value - DateTime.UtcNow).TotalMinutes);
            _logger.LogWarning("Login attempt for locked account {Email}", PiiMaskingHelper.MaskEmail(user.Email));
            return new AuthResult(false, Error: $"Account is temporarily locked. Please try again in {remainingMinutes} minute(s).");
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            // Increment failed login attempts
            user.FailedLoginAttempts++;
            user.DateUpdated = DateTime.UtcNow;

            // Check if we should lock the account
            if (user.FailedLoginAttempts >= MaxFailedLoginAttempts)
            {
                user.LockoutEndTime = DateTime.UtcNow.Add(LockoutDuration);
                _logger.LogWarning("Account {Email} locked after {Attempts} failed login attempts",
                    PiiMaskingHelper.MaskEmail(user.Email), user.FailedLoginAttempts);
            }
            else
            {
                _logger.LogInformation("Failed login attempt {Attempts}/{Max} for {Email}",
                    user.FailedLoginAttempts, MaxFailedLoginAttempts, PiiMaskingHelper.MaskEmail(user.Email));
            }

            await _context.SaveChangesAsync(cancellationToken);
            return new AuthResult(false, Error: "Invalid email or password");
        }

        if (!user.IsActive)
        {
            return new AuthResult(false, Error: "Account is deactivated");
        }

        // Check if email is verified
        if (!user.EmailVerified)
        {
            return new AuthResult(false, Error: "Please verify your email address before logging in. Check your inbox for the verification link.");
        }

        // Reset failed login attempts on successful login
        user.FailedLoginAttempts = 0;
        user.LockoutEndTime = null;
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
        var cacheKey = $"{EmailVerificationKeyPrefix}{token}";

        // Atomically retrieve and remove token to prevent replay attacks
        var tokenData = await _cacheService.GetAndRemoveAsync<EmailVerificationTokenData>(cacheKey, cancellationToken);

        if (tokenData == null)
        {
            _logger.LogWarning("Invalid, expired, or already-used email verification token attempted");
            return false;
        }

        // Get the user
        var user = await Users.FirstOrDefaultAsync(u => u.UserId == tokenData.UserId, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("Email verification token for non-existent user {UserId}", tokenData.UserId);
            return false;
        }

        // Check if email is already verified
        if (user.EmailVerified)
        {
            _logger.LogInformation("Email already verified for user {UserId}", user.UserId);
            return true; // Return true anyway since the goal is achieved
        }

        // Mark email as verified
        user.EmailVerified = true;
        user.DateEmailVerified = DateTime.UtcNow;
        user.DateUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Email verified successfully for user {UserId}", user.UserId);

        // Send welcome email
        try
        {
            await _emailService.SendWelcomeEmailAsync(
                user.Email,
                user.Username,
                cancellationToken);
        }
        catch (Exception ex)
        {
            // Don't fail verification if welcome email fails
            _logger.LogWarning(ex, "Failed to send welcome email to {Email}", PiiMaskingHelper.MaskEmail(user.Email));
        }

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
                user.Username,
                resetUrl,
                cancellationToken);

            _logger.LogInformation("Password reset email sent to {Email}", PiiMaskingHelper.MaskEmail(user.Email));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", PiiMaskingHelper.MaskEmail(user.Email));
            // Remove the token from cache since email failed
            await _cacheService.RemoveAsync(cacheKey, cancellationToken);
            throw;
        }

        return true;
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken = default)
    {
        // Validate password strength before checking token (fail fast)
        var passwordValidation = ValidationHelper.ValidatePassword(newPassword);
        if (!passwordValidation.IsValid)
        {
            _logger.LogWarning("Password reset failed validation: {Errors}", string.Join("; ", passwordValidation.Errors));
            return false;
        }

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
                user.Username,
                DateTime.UtcNow,
                cancellationToken);
        }
        catch (Exception ex)
        {
            // Don't fail the reset if notification email fails
            _logger.LogWarning(ex, "Failed to send password changed notification to {Email}", PiiMaskingHelper.MaskEmail(user.Email));
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

    private class EmailVerificationTokenData
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
