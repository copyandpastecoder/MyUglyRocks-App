using System.Text.RegularExpressions;

namespace MyUglyRocks.Core.Validation;

/// <summary>
/// Centralized validation helper for backend security rules.
/// These rules should match frontend validation for consistency.
/// </summary>
public static partial class ValidationHelper
{
    // Password requirements
    public const int MinPasswordLength = 12;
    public const int MaxPasswordLength = 128;

    // Common weak passwords to reject
    private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "password123", "123456", "12345678", "qwerty", "abc123",
        "monkey", "master", "dragon", "111111", "baseball", "iloveyou",
        "trustno1", "sunshine", "princess", "welcome", "shadow", "superman",
        "michael", "football", "password1", "password12", "password123!",
        "letmein", "admin", "admin123", "root", "toor", "pass", "test",
        "guest", "master", "changeme", "123456789", "12345", "1234567",
        "1234567890", "0987654321", "qwertyuiop", "mypassword"
    };

    /// <summary>
    /// Validates password strength according to security requirements.
    /// </summary>
    public static PasswordValidationResult ValidatePassword(string? password)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(password))
        {
            errors.Add("Password is required");
            return new PasswordValidationResult(false, errors);
        }

        if (password.Length < MinPasswordLength)
        {
            errors.Add($"Password must be at least {MinPasswordLength} characters");
        }

        if (password.Length > MaxPasswordLength)
        {
            errors.Add($"Password must be at most {MaxPasswordLength} characters");
        }

        if (!HasUppercase().IsMatch(password))
        {
            errors.Add("Password must contain at least one uppercase letter");
        }

        if (!HasLowercase().IsMatch(password))
        {
            errors.Add("Password must contain at least one lowercase letter");
        }

        if (!HasDigit().IsMatch(password))
        {
            errors.Add("Password must contain at least one number");
        }

        if (!HasSpecialChar().IsMatch(password))
        {
            errors.Add("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)");
        }

        // Check for common passwords (case-insensitive)
        if (CommonPasswords.Contains(password))
        {
            errors.Add("Password is too common. Please choose a more secure password");
        }

        // Check for sequential characters
        if (HasSequentialChars(password))
        {
            errors.Add("Password should not contain sequential characters (e.g., 123, abc)");
        }

        // Check for repeated characters
        if (HasRepeatedChars(password))
        {
            errors.Add("Password should not contain more than 3 repeated characters in a row");
        }

        return new PasswordValidationResult(errors.Count == 0, errors);
    }

    /// <summary>
    /// Validates string length constraints.
    /// </summary>
    public static List<string> ValidateStringLength(
        string? value,
        string fieldName,
        int minLength = 0,
        int maxLength = int.MaxValue,
        bool required = false)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(value))
        {
            if (required)
            {
                errors.Add($"{fieldName} is required");
            }
            return errors;
        }

        if (value.Length < minLength)
        {
            errors.Add($"{fieldName} must be at least {minLength} characters");
        }

        if (value.Length > maxLength)
        {
            errors.Add($"{fieldName} must be at most {maxLength} characters");
        }

        return errors;
    }

    /// <summary>
    /// Validates email format.
    /// </summary>
    public static bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        return EmailRegex().IsMatch(email);
    }

    /// <summary>
    /// Validates that a numeric value is within range.
    /// </summary>
    public static List<string> ValidateRange(
        decimal? value,
        string fieldName,
        decimal minValue = decimal.MinValue,
        decimal maxValue = decimal.MaxValue,
        bool required = false)
    {
        var errors = new List<string>();

        if (!value.HasValue)
        {
            if (required)
            {
                errors.Add($"{fieldName} is required");
            }
            return errors;
        }

        if (value < minValue)
        {
            errors.Add($"{fieldName} must be at least {minValue}");
        }

        if (value > maxValue)
        {
            errors.Add($"{fieldName} must be at most {maxValue}");
        }

        return errors;
    }

    private static bool HasSequentialChars(string password)
    {
        const string sequences = "abcdefghijklmnopqrstuvwxyz0123456789";
        var lower = password.ToLowerInvariant();

        for (int i = 0; i < lower.Length - 2; i++)
        {
            var slice = lower.Substring(i, 3);
            if (sequences.Contains(slice))
                return true;

            // Check reverse sequences
            var reversed = new string(slice.Reverse().ToArray());
            if (sequences.Contains(reversed))
                return true;
        }

        return false;
    }

    private static bool HasRepeatedChars(string password)
    {
        for (int i = 0; i < password.Length - 3; i++)
        {
            if (password[i] == password[i + 1] &&
                password[i] == password[i + 2] &&
                password[i] == password[i + 3])
            {
                return true;
            }
        }
        return false;
    }

    // Regex patterns using source generators for performance
    [GeneratedRegex(@"[A-Z]")]
    private static partial Regex HasUppercase();

    [GeneratedRegex(@"[a-z]")]
    private static partial Regex HasLowercase();

    [GeneratedRegex(@"[0-9]")]
    private static partial Regex HasDigit();

    [GeneratedRegex(@"[!@#$%^&*(),.?""':{}|<>\[\]\\;`~_+\-=/]")]
    private static partial Regex HasSpecialChar();

    [GeneratedRegex(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")]
    private static partial Regex EmailRegex();

    /// <summary>
    /// Common string length limits used across the application.
    /// </summary>
    public static class StringLimits
    {
        public const int UsernameMin = 3;
        public const int UsernameMax = 50;
        public const int DisplayNameMax = 100;
        public const int EmailMax = 254;
        public const int BioMax = 500;
        public const int TitleMax = 200;
        public const int DescriptionMax = 2000;
        public const int NotesMax = 1000;
        public const int CommentMax = 5000;
        public const int BrandMax = 100;
        public const int ModelMax = 100;
        public const int NicknameMax = 50;
    }
}

/// <summary>
/// Result of password validation.
/// </summary>
public record PasswordValidationResult(bool IsValid, List<string> Errors);
