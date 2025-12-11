namespace MyUglyRocks.Api.Helpers;

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
