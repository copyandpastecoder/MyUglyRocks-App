using MyUglyRocks.Abstractions.Interfaces;
using UAParser;

namespace MyUglyRocks.Infrastructure.Services;

public class UserAgentParserService : IUserAgentParserService
{
    private readonly Parser _parser = Parser.GetDefault();

    // Known bot user agents to filter out
    private static readonly string[] BotPatterns =
    [
        "bot", "crawler", "spider", "slurp", "bingpreview",
        "googlebot", "baiduspider", "yandex", "duckduckbot",
        "facebot", "ia_archiver", "semrush", "ahrefs"
    ];

    public UserAgentInfoDto Parse(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return new UserAgentInfoDto(
                "Unknown",
                "0.0.0",
                null,
                "Unknown",
                "0.0",
                DeviceTypeDto.Unknown
            );
        }

        // Check if this is a bot
        var lowerUserAgent = userAgent.ToLowerInvariant();
        if (BotPatterns.Any(pattern => lowerUserAgent.Contains(pattern)))
        {
            return new UserAgentInfoDto(
                "Bot",
                "0.0.0",
                null,
                "Bot",
                "0.0",
                DeviceTypeDto.Unknown
            );
        }

        var clientInfo = _parser.Parse(userAgent);

        var deviceType = DetermineDeviceType(clientInfo);
        int.TryParse(clientInfo.UA.Major, out var majorVersion);

        return new UserAgentInfoDto(
            clientInfo.UA.Family ?? "Unknown",
            FormatVersion(clientInfo.UA.Major, clientInfo.UA.Minor, clientInfo.UA.Patch),
            majorVersion > 0 ? majorVersion : null,
            clientInfo.OS.Family ?? "Unknown",
            FormatVersion(clientInfo.OS.Major, clientInfo.OS.Minor),
            deviceType
        );
    }

    private static DeviceTypeDto DetermineDeviceType(ClientInfo clientInfo)
    {
        var deviceFamily = clientInfo.Device.Family?.ToLowerInvariant() ?? "";
        var osFamily = clientInfo.OS.Family?.ToLowerInvariant() ?? "";

        // Check for mobile devices
        if (deviceFamily.Contains("iphone") ||
            deviceFamily.Contains("android") ||
            deviceFamily.Contains("mobile") ||
            osFamily.Contains("android") && !deviceFamily.Contains("tablet"))
        {
            return DeviceTypeDto.Mobile;
        }

        // Check for tablets
        if (deviceFamily.Contains("ipad") ||
            deviceFamily.Contains("tablet") ||
            deviceFamily.Contains("kindle"))
        {
            return DeviceTypeDto.Tablet;
        }

        // Check OS for additional hints
        if (osFamily.Contains("ios") && !deviceFamily.Contains("ipad"))
        {
            return DeviceTypeDto.Mobile;
        }

        // Desktop or unknown
        if (osFamily.Contains("windows") ||
            osFamily.Contains("mac os") ||
            osFamily.Contains("linux") && !osFamily.Contains("android"))
        {
            return DeviceTypeDto.Desktop;
        }

        return DeviceTypeDto.Unknown;
    }

    private static string FormatVersion(string? major, string? minor, string? patch = null)
    {
        if (string.IsNullOrEmpty(major))
            return "0.0.0";

        if (string.IsNullOrEmpty(minor))
            return $"{major}.0.0";

        if (string.IsNullOrEmpty(patch))
            return $"{major}.{minor}";

        return $"{major}.{minor}.{patch}";
    }
}
