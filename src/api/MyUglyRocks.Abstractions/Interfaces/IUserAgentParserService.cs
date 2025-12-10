namespace MyUglyRocks.Abstractions.Interfaces;

public enum DeviceTypeDto
{
    Desktop = 0,
    Mobile = 1,
    Tablet = 2,
    Unknown = 3
}

public record UserAgentInfoDto(
    string BrowserName,
    string BrowserVersion,
    int? BrowserMajorVersion,
    string OsName,
    string OsVersion,
    DeviceTypeDto DeviceType
);

public interface IUserAgentParserService
{
    UserAgentInfoDto Parse(string? userAgent);
}
