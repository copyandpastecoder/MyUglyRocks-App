using System.ComponentModel.DataAnnotations;

namespace MyUglyRocks.Abstractions.DTOs;

/// <summary>
/// Request to create a demo account
/// </summary>
public record CreateDemoAccountRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email
);

/// <summary>
/// Response after creating demo account (includes one-time password view)
/// </summary>
public record DemoAccountCreatedResponse(
    Guid UserId,
    string Email,
    string Username,
    string Password, // ONLY SHOWN ONCE - not stored
    string Message,
    DateTime DateCreated
);

/// <summary>
/// Demo account list item
/// </summary>
public record DemoAccountListDto(
    Guid UserId,
    string Email,
    string Username,
    DateTime DateCreated,
    DateTime? DateLastLogin,
    int InventoryCount,
    int CycleCount,
    int PhotoCount
);

/// <summary>
/// Demo account deletion result
/// </summary>
public record DemoAccountDeletionResult(
    bool Success,
    string Message,
    int PhotosDeleted,
    int RecordsDeleted
);

/// <summary>
/// Photo copy job result
/// </summary>
public record PhotoCopyJobResult(
    bool Success,
    string Message,
    int PhotosCopied,
    int CyclePhotosCopied
);
