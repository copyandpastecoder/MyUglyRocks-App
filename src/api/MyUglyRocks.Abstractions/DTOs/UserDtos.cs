using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

// User profile DTOs
public record UserProfileDto(
    Guid UserId,
    string Username,
    string Email,
    string? DisplayName,
    string? Bio,
    string? AvatarUrl,
    bool EmailVerified,
    string Role,
    DateTime DateCreated
);

public record UpdateProfileRequest(
    [StringLength(100, ErrorMessage = "Display name must be at most 100 characters")]
    string? DisplayName,

    [StringLength(500, ErrorMessage = "Bio must be at most 500 characters")]
    string? Bio
);

public record ChangePasswordRequest(
    [Required(ErrorMessage = "Current password is required")]
    string CurrentPassword,

    [Required(ErrorMessage = "New password is required")]
    [StringLength(128, MinimumLength = 12, ErrorMessage = "Password must be between 12 and 128 characters")]
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
    [StringLength(20, ErrorMessage = "Measurement system must be at most 20 characters")]
    string? MeasurementSystem = null,

    [StringLength(20, ErrorMessage = "Date format must be at most 20 characters")]
    string? DateFormat = null,

    [StringLength(20, ErrorMessage = "Time format must be at most 20 characters")]
    string? TimeFormat = null,

    [StringLength(64, ErrorMessage = "Timezone must be at most 64 characters")]
    string? Timezone = null,

    [StringLength(20, ErrorMessage = "First day of week must be at most 20 characters")]
    string? FirstDayOfWeek = null,

    bool? ShowRelativeTimes = null,

    [StringLength(20, ErrorMessage = "Font size must be at most 20 characters")]
    string? FontSize = null,

    [StringLength(20, ErrorMessage = "Density must be at most 20 characters")]
    string? Density = null,

    [StringLength(50, ErrorMessage = "Default home section must be at most 50 characters")]
    string? DefaultHomeSection = null,

    bool? NotifyStageReminders = null,
    bool? NotifyComments = null,
    bool? NotifyReplies = null,
    bool? NotifyUglyRocks = null,
    bool? NotifyRecipeCloned = null,
    bool? QuietHoursEnabled = null,

    [StringLength(10, ErrorMessage = "Quiet hours start must be at most 10 characters")]
    string? QuietHoursStart = null,

    [StringLength(10, ErrorMessage = "Quiet hours end must be at most 10 characters")]
    string? QuietHoursEnd = null,

    [StringLength(20, ErrorMessage = "Digest frequency must be at most 20 characters")]
    string? DigestFrequency = null,

    [StringLength(20, ErrorMessage = "Photo upload quality must be at most 20 characters")]
    string? PhotoUploadQuality = null,

    bool? AddWatermark = null,
    bool? AutoFillFromLastRun = null,

    [StringLength(20, ErrorMessage = "Default post visibility must be at most 20 characters")]
    string? DefaultPostVisibility = null,

    [StringLength(50, ErrorMessage = "Theme must be at most 50 characters")]
    string? Theme = null
);

// Account DTOs
public record DeactivateAccountRequest(
    [Required(ErrorMessage = "Password is required")]
    string Password,

    [StringLength(500, ErrorMessage = "Reason must be at most 500 characters")]
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
