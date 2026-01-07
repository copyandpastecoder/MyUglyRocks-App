using System.Text.RegularExpressions;

namespace MyUglyRocks.Abstractions.Helpers;

/// <summary>
/// Helper class for validating and clamping pagination parameters.
/// Prevents resource exhaustion attacks via unlimited page sizes.
/// </summary>
public static class PaginationHelper
{
    public const int MaxPageSize = 100;
    public const int MaxSkip = 10000;
    public const int DefaultPageSize = 20;

    /// <summary>
    /// Allowed sort values for posts endpoint.
    /// </summary>
    private static readonly HashSet<string> AllowedPostSortValues = new(StringComparer.OrdinalIgnoreCase)
    {
        "newest", "votes", "comments"
    };

    /// <summary>
    /// Regex pattern for valid usernames (alphanumeric, underscores, 3-50 chars).
    /// </summary>
    private static readonly Regex UsernamePattern = new(@"^[a-zA-Z0-9_]{3,50}$", RegexOptions.Compiled);

    /// <summary>
    /// Validates sort parameter against whitelist. Returns null if invalid.
    /// </summary>
    public static string? ValidatePostSort(string? sort)
    {
        if (string.IsNullOrWhiteSpace(sort))
            return null; // Will use default

        return AllowedPostSortValues.Contains(sort) ? sort.ToLowerInvariant() : null;
    }

    /// <summary>
    /// Validates username format and length.
    /// </summary>
    public static bool IsValidUsername(string? username, out string? error)
    {
        error = null;

        if (string.IsNullOrWhiteSpace(username))
        {
            error = "Username is required";
            return false;
        }

        if (username.Length > 50)
        {
            error = "Username cannot exceed 50 characters";
            return false;
        }

        if (!UsernamePattern.IsMatch(username))
        {
            error = "Username must be 3-50 characters and contain only letters, numbers, and underscores";
            return false;
        }

        return true;
    }

    /// <summary>
    /// Validates and clamps 'take' parameter to prevent resource exhaustion.
    /// </summary>
    public static int ClampTake(int take)
    {
        return Math.Clamp(take, 1, MaxPageSize);
    }

    /// <summary>
    /// Validates and clamps 'skip' parameter to prevent abuse.
    /// </summary>
    public static int ClampSkip(int skip)
    {
        return Math.Clamp(skip, 0, MaxSkip);
    }

    /// <summary>
    /// Validates and clamps 'pageSize' parameter to prevent resource exhaustion.
    /// </summary>
    public static int ClampPageSize(int pageSize)
    {
        return Math.Clamp(pageSize, 1, MaxPageSize);
    }

    /// <summary>
    /// Validates and clamps 'page' parameter.
    /// </summary>
    public static int ClampPage(int page)
    {
        return Math.Max(page, 1);
    }
}
