namespace MyUglyRocks.Infrastructure.Configuration;

public class EmailSettings
{
    public const string SectionName = "Email";

    public string ApiKey { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@myuglyrocks.com";
    public string FromName { get; set; } = "MyUglyRocks";
    public string BaseUrl { get; set; } = "https://myuglyrocks.com";
    public bool Enabled { get; set; } = true;
}
