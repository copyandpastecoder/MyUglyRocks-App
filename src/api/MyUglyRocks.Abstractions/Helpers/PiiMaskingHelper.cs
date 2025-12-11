using System.Security.Cryptography;
using System.Text;

namespace MyUglyRocks.Abstractions.Helpers;

/// <summary>
/// Helper class for masking PII (Personally Identifiable Information) in logs.
/// Prevents sensitive data exposure while maintaining traceability.
/// </summary>
public static class PiiMaskingHelper
{
    /// <summary>
    /// Masks an email address for logging.
    /// Example: "user@example.com" -> "u***@e***.com"
    /// </summary>
    public static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return "[empty]";

        var parts = email.Split('@');
        if (parts.Length != 2)
            return "[invalid-email]";

        var localPart = parts[0];
        var domainParts = parts[1].Split('.');

        // Mask local part: show first char, mask rest
        var maskedLocal = localPart.Length > 1
            ? $"{localPart[0]}***"
            : "***";

        // Mask domain: show first char of domain name
        var maskedDomain = domainParts.Length >= 2
            ? $"{domainParts[0][0]}***.{domainParts[^1]}"
            : $"{domainParts[0][0]}***";

        return $"{maskedLocal}@{maskedDomain}";
    }

    /// <summary>
    /// Creates a hash of the email for correlation purposes.
    /// Allows tracking without exposing PII.
    /// </summary>
    public static string HashEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return "[empty]";

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(email.ToLowerInvariant()));
        return Convert.ToHexString(bytes)[..12]; // First 12 chars of hash
    }

    /// <summary>
    /// Masks a username for logging.
    /// Example: "johndoe" -> "joh***"
    /// </summary>
    public static string MaskUsername(string? username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return "[empty]";

        if (username.Length <= 3)
            return "***";

        return $"{username[..3]}***";
    }

    /// <summary>
    /// Masks an IP address for logging.
    /// Example: "192.168.1.100" -> "192.168.x.x"
    /// </summary>
    public static string MaskIpAddress(string? ip)
    {
        if (string.IsNullOrWhiteSpace(ip))
            return "[empty]";

        // IPv4
        var parts = ip.Split('.');
        if (parts.Length == 4)
            return $"{parts[0]}.{parts[1]}.x.x";

        // IPv6 - show first segment only
        if (ip.Contains(':'))
        {
            var colonIndex = ip.IndexOf(':');
            return colonIndex > 0 ? $"{ip[..colonIndex]}:x:x:x:x:x:x:x" : "x:x:x:x:x:x:x:x";
        }

        return "[masked-ip]";
    }
}
