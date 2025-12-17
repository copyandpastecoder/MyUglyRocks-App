namespace MyUglyRocks.Infrastructure.Configuration;

public class GeminiSettings
{
    public const string SectionName = "Gemini";

    /// <summary>
    /// Google Gemini API key
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Model to use (default: gemini-2.5-flash for free tier)
    /// </summary>
    public string Model { get; set; } = "gemini-2.5-flash";

    /// <summary>
    /// Whether the Gemini integration is configured
    /// </summary>
    public bool IsConfigured => !string.IsNullOrEmpty(ApiKey);
}
