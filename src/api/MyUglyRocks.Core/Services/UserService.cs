using Mapster;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class UserService : IUserService
{
    private readonly DbContext _context;
    private readonly IStorageService _storageService;
    private readonly IImageProcessingService _imageProcessingService;
    private readonly ILogger<UserService> _logger;

    public UserService(
        DbContext context,
        IStorageService storageService,
        IImageProcessingService imageProcessingService,
        ILogger<UserService> logger)
    {
        _context = context;
        _storageService = storageService;
        _imageProcessingService = imageProcessingService;
        _logger = logger;
    }

    private DbSet<User> Users => _context.Set<User>();
    private DbSet<UserSettings> UserSettingsSet => _context.Set<UserSettings>();
    private DbSet<RefreshToken> RefreshTokens => _context.Set<RefreshToken>();
    private DbSet<Cycle> Cycles => _context.Set<Cycle>();
    private DbSet<Post> Posts => _context.Set<Post>();
    private DbSet<Vote> Votes => _context.Set<Vote>();
    private DbSet<Comment> Comments => _context.Set<Comment>();

    #region Profile

    public async Task<UserProfileDto?> GetProfileAsync(Guid userId)
    {
        var user = await Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        return user?.Adapt<UserProfileDto>();
    }

    public async Task<UserProfileDto?> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        if (user == null) return null;

        if (request.DisplayName != null)
            user.DisplayName = request.DisplayName;

        if (request.Bio != null)
            user.Bio = request.Bio;

        await _context.SaveChangesAsync();

        return user.Adapt<UserProfileDto>();
    }

    public async Task<string?> UploadAvatarAsync(Guid userId, Stream imageStream, string fileName, string contentType)
    {
        if (!_storageService.IsConfigured)
        {
            _logger.LogWarning("Storage not configured, avatar upload skipped for user {UserId}", userId);
            return null;
        }

        var user = await Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
        if (user == null) return null;

        try
        {
            // Delete old avatar if exists
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                var oldKey = ExtractStorageKeyFromUrl(user.AvatarUrl);
                if (!string.IsNullOrEmpty(oldKey))
                {
                    await _storageService.DeleteAsync(oldKey);
                }
            }

            // Process the image: crop to square and resize to 256x256 WebP
            var processedAvatar = await _imageProcessingService.ProcessAvatarAsync(imageStream, fileName);

            // Upload with a consistent key based on user ID
            var key = $"{userId}.webp";
            var folder = "avatars";

            var avatarUrl = await _storageService.UploadAsync(
                processedAvatar.Stream,
                $"{userId}.webp",
                folder,
                key);

            // Dispose the processed stream
            await processedAvatar.Stream.DisposeAsync();

            // Update user record
            user.AvatarUrl = avatarUrl;
            user.DateUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Avatar uploaded for user {UserId}: {AvatarUrl}", userId, avatarUrl);

            return avatarUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload avatar for user {UserId}", userId);
            return null;
        }
    }

    private static string? ExtractStorageKeyFromUrl(string url)
    {
        if (string.IsNullOrEmpty(url)) return null;

        try
        {
            var uri = new Uri(url);
            return uri.AbsolutePath.TrimStart('/');
        }
        catch
        {
            return null;
        }
    }

    #endregion

    #region Settings

    public async Task<UserSettingsDto> GetSettingsAsync(Guid userId)
    {
        var settings = await UserSettingsSet
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            // Create default settings for the user
            settings = new UserSettings { UserId = userId };
            UserSettingsSet.Add(settings);
            await _context.SaveChangesAsync();
        }

        return MapToDto(settings);
    }

    public async Task<UserSettingsDto> UpdateSettingsAsync(Guid userId, UpdateSettingsRequest request)
    {
        var settings = await UserSettingsSet
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserSettings { UserId = userId };
            UserSettingsSet.Add(settings);
        }

        // Apply updates only for non-null values
        if (request.MeasurementSystem != null && Enum.TryParse<MeasurementSystem>(request.MeasurementSystem, true, out var ms))
            settings.MeasurementSystem = ms;
        if (request.DateFormat != null && Enum.TryParse<DateFormat>(request.DateFormat, true, out var df))
            settings.DateFormat = df;
        if (request.TimeFormat != null && Enum.TryParse<TimeFormat>(request.TimeFormat, true, out var tf))
            settings.TimeFormat = tf;
        if (request.Timezone != null)
            settings.Timezone = request.Timezone;
        if (request.FirstDayOfWeek != null && Enum.TryParse<FirstDayOfWeek>(request.FirstDayOfWeek, true, out var fdw))
            settings.FirstDayOfWeek = fdw;
        if (request.ShowRelativeTimes.HasValue)
            settings.ShowRelativeTimes = request.ShowRelativeTimes.Value;
        if (request.FontSize != null && Enum.TryParse<FontSize>(request.FontSize, true, out var fs))
            settings.FontSize = fs;
        if (request.Density != null && Enum.TryParse<Density>(request.Density, true, out var d))
            settings.Density = d;
        if (request.DefaultHomeSection != null && Enum.TryParse<DefaultHomeSection>(request.DefaultHomeSection, true, out var dhs))
            settings.DefaultHomeSection = dhs;
        if (request.NotifyStageReminders.HasValue)
            settings.NotifyStageReminders = request.NotifyStageReminders.Value;
        if (request.NotifyComments.HasValue)
            settings.NotifyComments = request.NotifyComments.Value;
        if (request.NotifyReplies.HasValue)
            settings.NotifyReplies = request.NotifyReplies.Value;
        if (request.NotifyUglyRocks.HasValue)
            settings.NotifyUglyRocks = request.NotifyUglyRocks.Value;
        if (request.NotifyRecipeCloned.HasValue)
            settings.NotifyRecipeCloned = request.NotifyRecipeCloned.Value;
        if (request.QuietHoursEnabled.HasValue)
            settings.QuietHoursEnabled = request.QuietHoursEnabled.Value;
        if (request.QuietHoursStart != null && TimeOnly.TryParse(request.QuietHoursStart, out var qhs))
            settings.QuietHoursStart = qhs;
        if (request.QuietHoursEnd != null && TimeOnly.TryParse(request.QuietHoursEnd, out var qhe))
            settings.QuietHoursEnd = qhe;
        if (request.DigestFrequency != null && Enum.TryParse<DigestFrequency>(request.DigestFrequency, true, out var dgf))
            settings.DigestFrequency = dgf;
        if (request.PhotoUploadQuality != null && Enum.TryParse<PhotoUploadQuality>(request.PhotoUploadQuality, true, out var puq))
            settings.PhotoUploadQuality = puq;
        if (request.AddWatermark.HasValue)
            settings.AddWatermark = request.AddWatermark.Value;
        if (request.AutoFillFromLastRun.HasValue)
            settings.AutoFillFromLastRun = request.AutoFillFromLastRun.Value;
        if (request.DefaultPostVisibility != null && Enum.TryParse<PostVisibility>(request.DefaultPostVisibility, true, out var pv))
            settings.DefaultPostVisibility = pv;
        if (request.Theme != null)
            settings.Theme = request.Theme;

        await _context.SaveChangesAsync();

        return MapToDto(settings);
    }

    private static UserSettingsDto MapToDto(UserSettings settings)
    {
        return new UserSettingsDto(
            MeasurementSystem: settings.MeasurementSystem.ToString(),
            DateFormat: settings.DateFormat.ToString(),
            TimeFormat: settings.TimeFormat.ToString(),
            Timezone: settings.Timezone,
            FirstDayOfWeek: settings.FirstDayOfWeek.ToString(),
            ShowRelativeTimes: settings.ShowRelativeTimes,
            FontSize: settings.FontSize.ToString(),
            Density: settings.Density.ToString(),
            DefaultHomeSection: settings.DefaultHomeSection.ToString(),
            NotifyStageReminders: settings.NotifyStageReminders,
            NotifyComments: settings.NotifyComments,
            NotifyReplies: settings.NotifyReplies,
            NotifyUglyRocks: settings.NotifyUglyRocks,
            NotifyRecipeCloned: settings.NotifyRecipeCloned,
            QuietHoursEnabled: settings.QuietHoursEnabled,
            QuietHoursStart: settings.QuietHoursStart?.ToString("HH:mm"),
            QuietHoursEnd: settings.QuietHoursEnd?.ToString("HH:mm"),
            DigestFrequency: settings.DigestFrequency.ToString(),
            PhotoUploadQuality: settings.PhotoUploadQuality.ToString(),
            AddWatermark: settings.AddWatermark,
            AutoFillFromLastRun: settings.AutoFillFromLastRun,
            DefaultPostVisibility: settings.DefaultPostVisibility.ToString(),
            Theme: settings.Theme
        );
    }

    #endregion

    #region Account

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        if (user == null) return false;

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return false;

        // Hash and set new password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.DatePasswordChanged = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeactivateAccountAsync(Guid userId, DeactivateAccountRequest request)
    {
        var user = await Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        if (user == null) return false;

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return false;

        // Deactivate the account (soft delete)
        user.IsActive = false;

        // Revoke all refresh tokens
        var tokens = await RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.DateRevoked = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Stats

    public async Task<UserStatsDto> GetUserStatsAsync(Guid userId)
    {
        var user = await Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new KeyNotFoundException("User not found");

        var totalCycles = await Cycles
            .CountAsync(c => c.UserId == userId);

        var completedCycles = await Cycles
            .CountAsync(c => c.UserId == userId && c.Status == CycleStatus.Completed);

        var totalPosts = await Posts
            .CountAsync(p => p.UserId == userId);

        var totalVotesReceived = await Votes
            .CountAsync(v => Posts.Any(p => p.Id == v.PostId && p.UserId == userId));

        var totalCommentsReceived = await Comments
            .CountAsync(c => Posts.Any(p => p.Id == c.PostId && p.UserId == userId));

        return new UserStatsDto(
            TotalCycles: totalCycles,
            CompletedCycles: completedCycles,
            TotalPosts: totalPosts,
            TotalVotesReceived: totalVotesReceived,
            TotalCommentsReceived: totalCommentsReceived,
            MemberSince: user.DateCreated
        );
    }

    #endregion
}
