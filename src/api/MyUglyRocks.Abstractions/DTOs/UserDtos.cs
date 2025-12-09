namespace MyUglyRocks.Abstractions.DTOs;

// User profile DTOs
public record UserProfileDto(
    Guid Id,
    string Username,
    string Email,
    string? DisplayName,
    string? Bio,
    string? AvatarUrl,
    bool EmailVerified,
    DateTime DateCreated
);

public record UpdateProfileRequest(
    string? DisplayName,
    string? Bio
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);

// User settings DTOs - using strings for enum values to avoid cross-layer dependencies
public record UserSettingsDto(
    string MeasurementSystem,
    string DateFormat,
    string TimeFormat,
    string Timezone,
    string FirstDayOfWeek,
    bool ShowRelativeTimes,
    string FontSize,
    string Density,
    string DefaultHomeSection,
    bool NotifyStageReminders,
    bool NotifyComments,
    bool NotifyReplies,
    bool NotifyUglyRocks,
    bool NotifyRecipeCloned,
    bool QuietHoursEnabled,
    string? QuietHoursStart,
    string? QuietHoursEnd,
    string DigestFrequency,
    string PhotoUploadQuality,
    bool AddWatermark,
    bool AutoFillFromLastRun,
    string DefaultPostVisibility,
    string Theme
);

public record UpdateSettingsRequest(
    string? MeasurementSystem = null,
    string? DateFormat = null,
    string? TimeFormat = null,
    string? Timezone = null,
    string? FirstDayOfWeek = null,
    bool? ShowRelativeTimes = null,
    string? FontSize = null,
    string? Density = null,
    string? DefaultHomeSection = null,
    bool? NotifyStageReminders = null,
    bool? NotifyComments = null,
    bool? NotifyReplies = null,
    bool? NotifyUglyRocks = null,
    bool? NotifyRecipeCloned = null,
    bool? QuietHoursEnabled = null,
    string? QuietHoursStart = null,
    string? QuietHoursEnd = null,
    string? DigestFrequency = null,
    string? PhotoUploadQuality = null,
    bool? AddWatermark = null,
    bool? AutoFillFromLastRun = null,
    string? DefaultPostVisibility = null,
    string? Theme = null
);

// Account DTOs
public record DeactivateAccountRequest(
    string Password,
    string? Reason
);

public record UserStatsDto(
    int TotalCycles,
    int CompletedCycles,
    int TotalPosts,
    int TotalVotesReceived,
    int TotalCommentsReceived,
    DateTime MemberSince
);
