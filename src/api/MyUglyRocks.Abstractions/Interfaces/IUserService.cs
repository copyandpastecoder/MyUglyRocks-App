using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

public interface IUserService
{
    // Profile
    Task<UserProfileDto?> GetProfileAsync(Guid userId);
    Task<UserProfileDto?> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<string?> UploadAvatarAsync(Guid userId, Stream imageStream, string fileName, string contentType);

    // Settings
    Task<UserSettingsDto> GetSettingsAsync(Guid userId);
    Task<UserSettingsDto> UpdateSettingsAsync(Guid userId, UpdateSettingsRequest request);

    // Account
    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<bool> DeactivateAccountAsync(Guid userId, DeactivateAccountRequest request);

    // Stats
    Task<UserStatsDto> GetUserStatsAsync(Guid userId);
}
