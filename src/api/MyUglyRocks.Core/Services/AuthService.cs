using Mapster;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class AuthService : IAuthService
{
    private readonly DbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly int _refreshTokenExpirationDays;

    public AuthService(
        DbContext context,
        ITokenService tokenService,
        IConfiguration configuration)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
        _refreshTokenExpirationDays = int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7");
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
            Id = Guid.NewGuid(),
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
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email, user.Username, user.Role == UserRole.Admin);
        var refreshToken = await CreateRefreshTokenAsync(user.Id, cancellationToken);

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
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email, user.Username, user.Role == UserRole.Admin);
        var refreshToken = await CreateRefreshTokenAsync(user.Id, cancellationToken);

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
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email, user.Username, user.Role == UserRole.Admin);
        var newRefreshToken = await CreateRefreshTokenAsync(user.Id, cancellationToken);

        storedToken.ReplacedByTokenId = newRefreshToken.Id;
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
            return true;
        }

        // TODO: Create PasswordResetToken entity and send email
        // For now, this is a placeholder
        return true;
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken = default)
    {
        // TODO: Implement with PasswordResetToken entity
        // For now, this is a placeholder that always returns false
        await Task.CompletedTask;
        return false;
    }

    private async Task<RefreshToken> CreateRefreshTokenAsync(Guid userId, CancellationToken cancellationToken)
    {
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = _tokenService.GenerateRefreshToken(),
            UserId = userId,
            DateExpires = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
            IsRevoked = false,
            DateCreated = DateTime.UtcNow,
            DateUpdated = DateTime.UtcNow
        };

        await RefreshTokens.AddAsync(refreshToken, cancellationToken);
        return refreshToken;
    }
}
